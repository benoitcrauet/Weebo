import os
from flask import Blueprint, render_template, request, redirect, url_for, abort
from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileRequired, FileAllowed
import wtforms
import wtforms.validators as validators
from PIL import Image
from io import BytesIO

from lib.db import session
from lib.models import Show
from lib.guid import generate_guid
from lib.picture import ResizeMinimal

bp = Blueprint(os.path.splitext(os.path.basename(__file__))[0], __name__)

app = None
def init(flaskapp):
    global app, bp
    app = flaskapp

    app.register_blueprint(bp)


@bp.route("/shows")
def shows():
    shows = session.query(Show).all()
    return render_template("shows/shows.jinja2", shows=shows)



# Classe de validation
class FormShowEdit(FlaskForm):
    id = wtforms.HiddenField("ID", validators=[])
    name = wtforms.StringField("Nom de l'émission", validators=[validators.DataRequired()], render_kw={"maxlength": 30})
    description = wtforms.StringField("Description", description="Une simple description, juste pour vous, pour vous y retrouver.", validators=[], render_kw={"maxlength": 150})
    logo = wtforms.FileField("Logo", description="Permet d'associer un logo à l'émission.", validators=[FileAllowed(["jpg","jpeg","png"])])
    logo_delete = wtforms.BooleanField("Supprimer le logo actuel")

    submit = wtforms.SubmitField("Valider")


@bp.route("/shows/create", methods=["GET","POST"])
@bp.route("/shows/<string:guid>/edit", methods=["GET","POST"])
def showEdit(guid=None):

    editMode = False
    if guid is not None:
        editMode = True
    
    if editMode:
        show = session.query(Show).filter(Show.id == guid).first()
    else:
        show = Show()
    

    # Si l'objet n'existe pas : 404
    if show==None:
        abort(404)

    form = FormShowEdit(obj=show)

    # Validation du formulaire
    if form.validate_on_submit():
        # Si on a un ID on récupère l'objet
        if form.id.data!="":
            show = session.query(Show).filter(Show.id == form.id.data).first()
            if show==None:
                return "Invalid show ID"
        else:
            show = Show()
        
        show.name = form.name.data
        show.description = form.description.data

        # On supprime le logo en cours ?
        try:
            if form.logo_delete.data:
                # Si on a un fichier enregistré, on essaye de le supprimer
                if show.logo != "":
                    os.remove("images/" + show.logo)
                    show.logo = None
            else:
                filename = show.logo
                # Si on a un fichier, on remplace l'ancien
                if form.id.data=="" or show.logo==None:
                    filename = generate_guid() + ".png"
                
                if form.logo.data:
                    # On ouvre le fichier
                    logo_bytes = request.files["logo"].read()
                    if logo_bytes:
                        image = Image.open(BytesIO(logo_bytes))

                        # On redimensionne l'image
                        w,h = image.size
                        nw,nh = ResizeMinimal(w, h, 500)
                        new_image = image.resize((nw,nh))

                        new_image.save("images/" + filename)

                        show.logo = filename

        except Exception as e:
            print(f"Picture upload error: {e}")

        if form.id.data=="":
            session.add(show)
        else:
            session.merge(show)
        session.commit()

        return redirect(url_for("shows.shows"))
    
    return render_template("shows/showEdit.jinja2", guid=guid, show=show, form=form)



# Classe de validation
class FormShowDelete(FlaskForm):
    delete = wtforms.SelectField("Supprimer ?", choices=[("n", "Non"), ("y", "Oui")], validators=[validators.DataRequired()])

    submit = wtforms.SubmitField("Supprimer")


@bp.route("/shows/<string:guid>/delete", methods=["GET","POST"])
def showDelete(guid):

    show = session.query(Show).filter(Show.id == guid).first()

    # Si l'objet n'existe pas : 404
    if show==None:
        abort(404)

    form = FormShowDelete()

    # Validation du formulaire
    if form.validate_on_submit():
        show = session.query(Show).filter(Show.id == guid).first()
        if show==None:
            return "ID invalide"
        
        if form.delete.data == "y":
            session.delete(show)
            session.commit()

        return redirect(url_for("shows.shows"))
    
    return render_template("shows/showDelete.jinja2", guid=guid, show=show, form=form)

