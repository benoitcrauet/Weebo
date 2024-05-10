from flask import Blueprint, render_template, redirect, url_for, session, jsonify, request
from urllib.parse import quote_plus, urlencode
from authlib.integrations.flask_client import OAuth
import json


from lib.config import config

app = None

bp = Blueprint("sso", __name__)

oauth_domain = config["sso_domain"]
oauth_metadata_url = config["sso_metadata_url"]
oauth_client_id = config["sso_client_id"]
oauth_client_secret = config["sso_client_secret"]

oauth = None
auth0 = None

def init(flaskapp):
    global app, oauth, auth0
    app = flaskapp

    oauth = OAuth(app)

    auth0 = oauth.register(
        'auth0',
        client_id=oauth_client_id,
        client_secret=oauth_client_secret,
        client_kwargs={
            "scope": "openid roles email",
        },
        server_metadata_url=oauth_metadata_url,
    )


@bp.route("/login")
def login():
    return auth0.authorize_redirect(redirect_uri=url_for("sso.logincallback", _external=True))

@bp.route("/login/callback", methods=["POST", "GET"])
def logincallback():
    token = auth0.authorize_access_token()
    print(token)
    session["user"] = token
    return jsonify(token)

@bp.route("/logout/backchannel", methods=["POST"])
def logoutbackchannel():
    print(request.data)
    return request.data


@bp.route("/logout")
def logout():
    session.clear()
    return redirect(
        "https://"
        + oauth_domain
        + "/v2/logout?"
        + urlencode(
            {
                "returnTo": url_for("home.home", _external=True),
                "client_id": oauth_client_id,
            },
            quote_via=quote_plus,
        )
    )


