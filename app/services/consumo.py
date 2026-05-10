from app.config import Config

def calcular_consumo_aparato(potencia_w, horas_dia):
    return (potencia_w * horas_dia) / 1000

def obtener_top_consumidores_db(aparatos, num_top=3):
    consumos = []
    for a in aparatos:
        potencia = a.get('potencia', 0)
        horas = a.get('horas', 0)
        consumo_mes = calcular_consumo_aparato(potencia, horas) * 30
        consumos.append({
            'id': a.get('id'), 
            'nombre': a.get('nombre', ''), 
            'consumo': consumo_mes,
            'potencia': potencia,
            'horas': horas
        })
    return sorted(consumos, key=lambda x: x['consumo'], reverse=True)[:num_top]

def obtener_datos_consumo(aparatos, tarifa):
    if not aparatos:
        return {
            'aparatos': [],
            'total_diario_kwh': 0,
            'total_mensual_kwh': 0,
            'costo_mensual_clp': 0
        }

    resultado_aparatos = []
    total_diario = 0
    
    for a in aparatos:
        potencia = a.get('potencia', 0)
        horas = a.get('horas', 0)
        kwh_dia = (potencia * horas) / 1000
        kwh_mes = kwh_dia * 30
        costo_mes = kwh_mes * tarifa
        
        total_diario += kwh_dia
        resultado_aparatos.append({
            'nombre': a.get('nombre', ''),
            'potencia_w': potencia,
            'horas_dia': horas,
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
