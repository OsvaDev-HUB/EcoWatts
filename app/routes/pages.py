from flask import Blueprint, render_template

bp = Blueprint('pages', __name__)

@bp.route('/')
def inicio():
    return render_template('dashboard.html')

@bp.route('/aparatos')
def aparatos_page():
    return render_template('aparatos.html')

@bp.route('/analisis')
def analisis_page():
    return render_template('analisis.html')

@bp.route('/simulacion')
def simulacion_page():
    return render_template('simulacion.html')

@bp.route('/recomendaciones')
def recomendaciones_page():
    return render_template('recomendaciones.html')

@bp.route('/configuracion')
def configuracion_page():
    return render_template('configuracion.html')
