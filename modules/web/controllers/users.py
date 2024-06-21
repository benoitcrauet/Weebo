import os
from flask import Blueprint, render_template, request, redirect, url_for, abort, jsonify, flash
from flask_wtf import FlaskForm
from flask_wtf.file import FileAllowed
from flask_cors import CORS
from flask_login import login_required, logout_user, login_user
import wtforms
import wtforms.validators as validators
import json

from lib.socketio import SocketIOInstance
from lib.db import session
from lib.models import User
from lib.guid import generate_guid
from lib.config import config
from lib.dict import model_to_dict
from lib.events import createNewEvent
from lib.users import for_admins, guest_required

bp = Blueprint(os.path.splitext(os.path.basename(__file__))[0], __name__)

app = None
socketio = None
def init(flaskapp):
    global app, bp, socketio
    app = flaskapp
    socketio = SocketIOInstance().socketio
    CORS(app, origins="*")

    app.register_blueprint(bp)



@bp.route("/login", methods=["GET", "POST"])
@guest_required
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = session.query(User).filter(User.username==username).first()
        if user and user.verify_password(password):
            login_user(user)
            flash("Vous êtes maintenant connecté ! Have fun!", "success")
            return redirect(url_for('home.home'))
        else:
            flash("Connexion impossible. Merci de vérifier vos identifiants ou adressez-vous à un administrateur.", "danger")
    return render_template("login.jinja2")



@bp.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("users.login"))




@bp.route("/users")
@login_required
@for_admins
def usersList():
    users = session.query(User).order_by(User.isAdmin.desc()).order_by(User.username.asc()).all()

    return render_template("users/usersList.jinja2", users=users)




# Classe de formulaire d'édition USER
class FormUserEdit(FlaskForm):
    firstname = wtforms.StringField("Prénom", description="Saisissez le prénom de l'utilisateur.", validators=[validators.DataRequired()])
    lastname = wtforms.StringField("Nom", description="Saisissez le nom de l'utilisateur.", validators=[validators.DataRequired()])
    username = wtforms.StringField("Login", description="Nom d'utilisateur unique que l'utilisateur devras entrer pour se connecter. Uniquement des lettres sans accents, des chiffres et des points.", validators=[validators.DataRequired(), validators.Regexp(r'^(?!.*\.\.)(?!.*\.$)(?!^\.)[a-z0-9]+(\.[a-z0-9]+)*$', message="Invalid username format.")])

    password1 = wtforms.PasswordField("Mot de passe", description="Saisissez un nouveau mot de passe à définir à l'utilisateur. Le nouveau mot de passe doit faire 10 caractères, contenir au minimum une lettre, un chiffre et un caractère spécial.", validators=[
        validators.Optional(),
        validators.Length(min=10, message="Password must be at least 10 characters long."),
        validators.Regexp(r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&+\-])[A-Za-z\d@$!%*?&+\-]{10,}$', message='Password must contain at least one letter, one number, and one special character.')
    ])
    password2 = wtforms.PasswordField("Confirmer le mot de passe", description="Saisissez à nouveau le mot de passe à définir pour l'utilisateur.", validators=[
        validators.Optional(),
        validators.EqualTo('password1', message='Passwords must match.')
    ])
    
    isAdmin = wtforms.BooleanField("Administrateur", description="Souhaitez-vous donner les droits administrateur à cet utilisateur ?")
    active = wtforms.BooleanField("Activer l'utilisateur", description="Décochez cette case pour désactiver ce compte utilisateur temporairement.")

    submit = wtforms.SubmitField("Valider")


@bp.route("/users/add", methods=["GET", "POST"])
@bp.route("/users/<string:user_guid>/edit", methods=["GET", "POST"])
@login_required
@for_admins
def usersEdit(user_guid=None):
    # On test si l'utilisateur existe
    if user_guid:
        user = session.query(User).filter(User.id == user_guid).first()
        edit = True

        if not user:
            abort(404, description="Cet utilisateur n'existe pas.")
    else:
        user = User()
        user.active = True
        edit = False
    

    # On liste les autres utilisateurs
    existingUsers = session.query(User).filter(User.username != user.username).all()
    
    # Chargement du formulaire
    form = FormUserEdit(obj=user)
    
    # Si le formulaire est validé
    if form.validate_on_submit():
        if not edit and form.password1.data=="":
            form.password1.errors.append("Password is required for each new user.")
        else:
            # On défini le mot de passe si nécessaire
            if edit and len(form.password1.data)>0:
                user.password = form.password1.data
            elif not edit:
                user.password = form.password1.data

            # On défini les autres infos
            user.firstname = form.firstname.data
            user.lastname = form.lastname.data
            user.username = form.username.data

            user.isAdmin = form.isAdmin.data
            user.active = form.active.data

            if edit:
                session.merge(user)
            else:
                session.add(user)
            
            session.commit()
            
            return redirect(url_for("users.usersList"))

    
    return render_template("users/usersEdit.jinja2", existingUsers=existingUsers, user=user, form=form)



# Classe de validation
class FormDelete(FlaskForm):
    delete = wtforms.SelectField("Supprimer ?", choices=[("n", "Non"), ("y", "Oui")], validators=[validators.DataRequired()])

    submit = wtforms.SubmitField("Supprimer")


@bp.route("/users/<string:user_guid>/delete", methods=["GET","POST"])
@login_required
@for_admins
def usersDelete(user_guid):
    # On test si l'utilisateur existe
    user = session.query(User).filter(User.id == user_guid).first()
    if not user:
        abort(404, description="Cet utilisateur n'existe pas.")

    form = FormDelete()

    # Validation du formulaire
    if form.validate_on_submit():
        if form.delete.data == "y":
            session.delete(user)
            session.commit()

        return redirect(url_for("users.usersList"))
    
    return render_template("users/usersDelete.jinja2", user=user, form=form)
