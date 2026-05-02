from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models.aparato import Aparato
from app.services.consumo import obtener_datos_consumo, obtener_top_consumidores_db
from app.config import Config

bp = Blueprint('api', __name__, url_prefix='/api')

@bp.route('/aparatos', methods=['GET'])
@login_required
def obtener_aparatos():
    aparatos = Aparato.query.filter_by(user_id=current_user.id).all()
    return jsonify([{
        'id': a.id,
        'nombre': a.nombre,
        'potencia': a.potencia,
        'horas': a.horas
    } for a in aparatos])

@bp.route('/aparatos', methods=['POST'])
@login_required
def agregar_aparato():
    data = request.get_json()
    if not data:
        return jsonify({'mensaje': 'Datos inválidos'}), 400
        
    nombre = data.get('nombre', '').strip()
    try:
        potencia = float(data.get('potencia_w', 0))
        horas = float(data.get('horas_dia', 0))
    except (ValueError, TypeError):
        return jsonify({'mensaje': 'Valores numéricos inválidos'}), 400
        
    if not nombre or len(nombre) > 100:
        return jsonify({'mensaje': 'Nombre inválido o muy largo'}), 400
    if potencia <= 0 or potencia > 50000:
        return jsonify({'mensaje': 'Potencia fuera de rango razonable (1-50000W)'}), 400
    if horas <= 0 or horas > 24:
        return jsonify({'mensaje': 'Horas de uso deben ser entre 0.1 y 24'}), 400

    try:
        nuevo = Aparato(
            nombre=nombre,
            potencia=potencia,
            horas=horas,
            user_id=current_user.id
        )
        db.session.add(nuevo)
        db.session.commit()
        return jsonify({'mensaje': 'Aparato agregado correctamente'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'mensaje': f'Error: {str(e)}'}), 500

@bp.route('/aparatos/<int:id>', methods=['DELETE'])
@login_required
def eliminar_aparato(id):
    aparato = Aparato.query.filter_by(id=id, user_id=current_user.id).first()
    if aparato:
        try:
            db.session.delete(aparato)
            db.session.commit()
            return jsonify({'mensaje': 'Aparato eliminado'})
        except Exception:
            db.session.rollback()
            return jsonify({'mensaje': 'Error al eliminar'}), 500
    return jsonify({'mensaje': 'No encontrado'}), 404

@bp.route('/aparatos/<int:id>', methods=['PUT'])
@login_required
def editar_aparato(id):
    data = request.get_json()
    if not data:
        return jsonify({'mensaje': 'Datos inválidos'}), 400
        
    aparato = Aparato.query.filter_by(id=id, user_id=current_user.id).first()
    if not aparato:
        return jsonify({'mensaje': 'No encontrado'}), 404
        
    nombre = data.get('nombre', '').strip()
    try:
        potencia = float(data.get('potencia_w', 0))
        horas = float(data.get('horas_dia', 0))
    except (ValueError, TypeError):
        return jsonify({'mensaje': 'Valores numéricos inválidos'}), 400
        
    if not nombre or len(nombre) > 100:
        return jsonify({'mensaje': 'Nombre inválido o muy largo'}), 400
    if potencia <= 0 or potencia > 50000:
        return jsonify({'mensaje': 'Potencia fuera de rango'}), 400
    if horas <= 0 or horas > 24:
        return jsonify({'mensaje': 'Horas de uso inválidas'}), 400

    try:
        aparato.nombre = nombre
        aparato.potencia = potencia
        aparato.horas = horas
        db.session.commit()
        return jsonify({'mensaje': 'Aparato actualizado'})
    except Exception:
        db.session.rollback()
        return jsonify({'mensaje': 'Error al actualizar'}), 500

@bp.route('/consumo', methods=['GET'])
@login_required
def calcular_consumo():
    datos = obtener_datos_consumo(current_user.id)
    return jsonify(datos)

@bp.route('/top-consumidores')
@login_required
def top_consumidores():
    top = obtener_top_consumidores_db(current_user.id, 3)
    total_data = obtener_datos_consumo(current_user.id)
    total_mensual = total_data['total_mensual_kwh']
    
    resultado = []
    for rank, item in enumerate(top, 1):
        porcentaje = (item['consumo'] / total_mensual * 100) if total_mensual > 0 else 0
        resultado.append({
            'rank': rank,
            'nombre': item['nombre'],
            'kwh_mes': item['consumo'],
            'porcentaje': porcentaje
        })
    
    return jsonify(resultado)

@bp.route('/simulacion', methods=['POST'])
@login_required
def simular_reduccion():
    data = request.get_json()
    if not data:
        return jsonify({'mensaje': 'Datos inválidos'}), 400
    
    try:
        porcentaje_reduccion = float(data.get('porcentaje_reduccion', 0))
    except (ValueError, TypeError):
        return jsonify({'mensaje': 'Porcentaje inválido'}), 400
        
    reduccion = porcentaje_reduccion / 100
    
    cons_data = obtener_datos_consumo(current_user.id)
    original = cons_data['total_mensual_kwh']
    nuevo = original * (1 - (reduccion * 0.5))
    
    return jsonify({
        'consumo_original': original,
        'consumo_nuevo': nuevo,
        'ahorro_kwh': original - nuevo,
        'ahorro_dinero': (original - nuevo) * Config.TARIFA_KWH,
        'ahorro_porcentual': (reduccion * 0.5) * 100
    })

@bp.route('/recomendaciones')
@login_required
def recomendaciones():
    top = obtener_top_consumidores_db(current_user.id, 3)
    sugerencias = []
    
    for item in top:
        horas_actuales = item['horas']
        potencia = item['potencia']
        
        reduccion = max(horas_actuales * 0.2, 0.5)
        if reduccion >= horas_actuales:
            reduccion = horas_actuales * 0.1
            
        horas_recomendadas = max(0, horas_actuales - reduccion)
        
        kwh_dia_ahorrados = (potencia * reduccion) / 1000
        ahorro_mes_dinero = kwh_dia_ahorrados * 30 * Config.TARIFA_KWH
        
        sugerencias.append({
            'aparato': item['nombre'],
            'horas_recomendada': horas_recomendadas,
            'ahorro_dinero': ahorro_mes_dinero
        })
    
    return jsonify(sugerencias)

@bp.route('/cargar-ejemplo', methods=['POST'])
@login_required
def cargar_ejemplo():
    ejemplos = [
        {'nombre': 'Refrigerador', 'potencia': 250, 'horas': 24},
        {'nombre': 'Televisor', 'potencia': 150, 'horas': 5},
        {'nombre': 'Aire Acondicionado', 'potencia': 1500, 'horas': 4}
    ]
    for ej in ejemplos:
        nuevo = Aparato(nombre=ej['nombre'], potencia=ej['potencia'], horas=ej['horas'], user_id=current_user.id)
        db.session.add(nuevo)
    db.session.commit()
    return jsonify({'mensaje': 'Ejemplos cargados'})
