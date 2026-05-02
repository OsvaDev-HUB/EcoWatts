from flask import Blueprint, render_template, redirect, url_for
from flask_login import login_required, current_user

bp = Blueprint('pages', __name__)

@bp.route('/')
def inicio():
    if not current_user.is_authenticated:
        return redirect(url_for('auth.login'))
    return render_template('dashboard.html')

@bp.route('/aparatos')
@login_required
def aparatos_page():
    return render_template('aparatos.html')

@bp.route('/analisis')
@login_required
def analisis_page():
    return render_template('analisis.html')

@bp.route('/simulacion')
@login_required
def simulacion_page():
    return render_template('simulacion.html')

@bp.route('/recomendaciones')
@login_required
def recomendaciones_page():
    return render_template('recomendaciones.html')
