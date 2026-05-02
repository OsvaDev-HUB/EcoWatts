from app.models.aparato import Aparato
from app.config import Config

def calcular_consumo_aparato(potencia_w, horas_dia):
    return (potencia_w * horas_dia) / 1000

def obtener_top_consumidores_db(user_id, num_top=3):
    aparatos = Aparato.query.filter_by(user_id=user_id).all()
    consumos = []
    for a in aparatos:
        consumo_mes = calcular_consumo_aparato(a.potencia, a.horas) * 30
        consumos.append({
            'id': a.id, 
            'nombre': a.nombre, 
            'consumo': consumo_mes,
            'potencia': a.potencia,
            'horas': a.horas
        })
    return sorted(consumos, key=lambda x: x['consumo'], reverse=True)[:num_top]

def obtener_datos_consumo(user_id):
    aparatos = Aparato.query.filter_by(user_id=user_id).all()
    if not aparatos:
        return {
            'aparatos': [],
            'total_diario_kwh': 0,
            'total_mensual_kwh': 0,
            'costo_mensual_clp': 0
        }

    resultado_aparatos = []
    total_diario = 0
    tarifa = Config.TARIFA_KWH
    
    for a in aparatos:
        kwh_dia = (a.potencia * a.horas) / 1000
        kwh_mes = kwh_dia * 30
        costo_mes = kwh_mes * tarifa
        
        total_diario += kwh_dia
        resultado_aparatos.append({
            'nombre': a.nombre,
            'potencia_w': a.potencia,
            'horas_dia': a.horas,
            'kwh_dia': kwh_dia,
            'kwh_mes': kwh_mes,
            'costo_mes': costo_mes
        })
    
    total_mensual = total_diario * 30
    costo_mensual = total_mensual * tarifa
    
    return {
        'aparatos': resultado_aparatos,
        'total_diario_kwh': total_diario,
        'total_mensual_kwh': total_mensual,
        'costo_mensual_clp': costo_mensual
    }
