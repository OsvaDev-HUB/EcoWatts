from app.extensions import db

class Aparato(db.Model):
    __tablename__ = 'aparatos'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    potencia = db.Column(db.Float, nullable=False)
    horas = db.Column(db.Float, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
