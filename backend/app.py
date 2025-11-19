from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import json

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///funnelcraft.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'funnelcraft-super-secret-key-2025')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# =============== MODELOS ===============

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(50), default='admin')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    clients = db.relationship('Client', back_populates='created_by_user')
    projects = db.relationship('Project', back_populates='created_by_user')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }

class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    company = db.Column(db.String(120))
    business_type = db.Column(db.String(100))
    website = db.Column(db.String(255))
    status = db.Column(db.String(50), default='active')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    notes = db.Column(db.Text)

    created_by_user = db.relationship('User', back_populates='clients')
    projects = db.relationship('Project', back_populates='client', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'company': self.company,
            'business_type': self.business_type,
            'website': self.website,
            'status': self.status,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'notes': self.notes,
            'project_count': len(self.projects)
        }

class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(50), default='planning')
    priority = db.Column(db.String(50), default='medium')
    budget = db.Column(db.Float)
    start_date = db.Column(db.DateTime)
    due_date = db.Column(db.DateTime)
    completion_date = db.Column(db.DateTime)
    description = db.Column(db.Text)
    funnel_type = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = db.relationship('Client', back_populates='projects')
    created_by_user = db.relationship('User', back_populates='projects')
    requirements = db.relationship('Requirement', back_populates='project', cascade='all, delete-orphan')
    tasks = db.relationship('Task', back_populates='project', cascade='all, delete-orphan')
    funnels = db.relationship('FunnelData', back_populates='project', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'client_id': self.client_id,
            'client_name': self.client.name if self.client else None,
            'created_by': self.created_by,
            'status': self.status,
            'priority': self.priority,
            'budget': self.budget,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'description': self.description,
            'funnel_type': self.funnel_type,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'requirement_count': len(self.requirements),
            'task_count': len(self.tasks),
            'progress': self._calculate_progress()
        }

    def _calculate_progress(self):
        if not self.tasks:
            return 0
        completed = len([t for t in self.tasks if t.status == 'completed'])
        return (completed / len(self.tasks)) * 100 if self.tasks else 0

# ============ MODELO NUEVO PARA DATOS DEL CONSTRUCTOR ============

class FunnelData(db.Model):
    __tablename__ = 'funnel_data'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)

    # Datos básicos
    client_name = db.Column(db.String(120))
    client_email = db.Column(db.String(120))
    client_phone = db.Column(db.String(20))
    business_type = db.Column(db.String(100))
    main_product = db.Column(db.String(255))

    # Objetivo del funnel
    funnel_destination = db.Column(db.String(100))
    traffic_source = db.Column(db.String(100))
    target_audience = db.Column(db.Text)
    follow_up_method = db.Column(db.String(50))

    # Contenido
    hero_title = db.Column(db.String(255))
    hero_description = db.Column(db.Text)
    cta_text = db.Column(db.String(100))

    # Diseño
    design_style = db.Column(db.String(100))
    primary_color = db.Column(db.String(7))
    secondary_color = db.Column(db.String(7))

    # Opciones
    domain_option = db.Column(db.String(100))
    custom_domain = db.Column(db.String(255))
    timeframe = db.Column(db.String(100))
    priority = db.Column(db.String(50))
    budget = db.Column(db.Float)

    # Módulos extras (JSON)
    extra_modules = db.Column(db.Text)  # JSON string
    languages = db.Column(db.Text)  # JSON string

    # Adicional
    additional_notes = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = db.relationship('Project', back_populates='funnels')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'client_name': self.client_name,
            'client_email': self.client_email,
            'client_phone': self.client_phone,
            'business_type': self.business_type,
            'main_product': self.main_product,
            'funnel_destination': self.funnel_destination,
            'traffic_source': self.traffic_source,
            'target_audience': self.target_audience,
            'follow_up_method': self.follow_up_method,
            'hero_title': self.hero_title,
            'hero_description': self.hero_description,
            'cta_text': self.cta_text,
            'design_style': self.design_style,
            'primary_color': self.primary_color,
            'secondary_color': self.secondary_color,
            'domain_option': self.domain_option,
            'custom_domain': self.custom_domain,
            'timeframe': self.timeframe,
            'priority': self.priority,
            'budget': self.budget,
            'extra_modules': json.loads(self.extra_modules) if self.extra_modules else [],
            'languages': json.loads(self.languages) if self.languages else [],
            'additional_notes': self.additional_notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Requirement(db.Model):
    __tablename__ = 'requirements'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(db.String(50), default='medium')
    status = db.Column(db.String(50), default='pending')
    category = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = db.relationship('Project', back_populates='requirements')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'title': self.title,
            'description': self.description,
            'priority': self.priority,
            'status': self.status,
            'category': self.category,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending')
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    due_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = db.relationship('Project', back_populates='tasks')
    assigned_user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'assigned_user': self.assigned_user.full_name if self.assigned_user else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

# =============== RUTAS BÁSICAS ===============

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email y contraseña son requeridos'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Usuario ya existe'}), 409

    user = User(
        email=data['email'],
        password=generate_password_hash(data['password']),
        full_name=data.get('full_name', 'Admin')
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Usuario creado exitosamente'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email y contraseña son requeridos'}), 400

    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Credenciales inválidas'}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

# =============== NUEVO ENDPOINT: GUARDAR DATOS DEL CONSTRUCTOR ===============

@app.route('/api/funnels/save', methods=['POST'])
def save_funnel_data():
    """
    Endpoint para guardar datos del constructor de funnels
    Crea automáticamente:
    1. Un cliente si no existe
    2. Un proyecto asociado al cliente
    3. Los datos del funnel
    """
    try:
        data = request.get_json()

        # Validar datos básicos
        if not data.get('client_email') or not data.get('client_name'):
            return jsonify({'error': 'Email y nombre del cliente son requeridos'}), 400

        # Buscar o crear cliente
        client = Client.query.filter_by(email=data['client_email']).first()

        if not client:
            client = Client(
                name=data.get('client_name'),
                email=data.get('client_email'),
                phone=data.get('client_phone'),
                company=data.get('company'),
                business_type=data.get('business_type'),
                website=data.get('website'),
                created_by=1,  # Admin por defecto
                notes=data.get('additional_notes')
            )
            db.session.add(client)
            db.session.flush()

        # Crear proyecto
        project = Project(
            name=f"Funnel - {data.get('main_product', 'Sin nombre')}",
            client_id=client.id,
            created_by=1,  # Admin por defecto
            status='planning',
            priority=data.get('priority', 'medium'),
            budget=data.get('budget'),
            funnel_type=data.get('funnel_destination'),
            description=data.get('additional_notes')
        )
        db.session.add(project)
        db.session.flush()

        # Guardar datos del funnel
        funnel_data = FunnelData(
            project_id=project.id,
            client_name=data.get('client_name'),
            client_email=data.get('client_email'),
            client_phone=data.get('client_phone'),
            business_type=data.get('business_type'),
            main_product=data.get('main_product'),
            funnel_destination=data.get('funnel_destination'),
            traffic_source=data.get('traffic_source'),
            target_audience=data.get('target_audience'),
            follow_up_method=data.get('follow_up_method'),
            hero_title=data.get('hero_title'),
            hero_description=data.get('hero_description'),
            cta_text=data.get('cta_text'),
            design_style=data.get('design_style'),
            primary_color=data.get('primary_color'),
            secondary_color=data.get('secondary_color'),
            domain_option=data.get('domain_option'),
            custom_domain=data.get('custom_domain'),
            timeframe=data.get('timeframe'),
            priority=data.get('priority'),
            budget=data.get('budget'),
            extra_modules=json.dumps(data.get('extra_modules', [])),
            languages=json.dumps(data.get('languages', [])),
            additional_notes=data.get('additional_notes')
        )
        db.session.add(funnel_data)
        db.session.commit()

        return jsonify({
            'message': 'Datos del funnel guardados exitosamente',
            'client': client.to_dict(),
            'project': project.to_dict(),
            'funnel_data': funnel_data.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =============== ENDPOINTS EXISTENTES ===============

@app.route('/api/clients', methods=['GET'])
@jwt_required()
def get_clients():
    page = request.args.get('page', 1, type=int)
    clients = Client.query.paginate(page=page, per_page=10)
    return jsonify({
        'clients': [c.to_dict() for c in clients.items],
        'total': clients.total,
        'pages': clients.pages,
        'current_page': page
    }), 200

@app.route('/api/clients', methods=['POST'])
@jwt_required()
def create_client():
    data = request.get_json()
    user_id = get_jwt_identity()
    client = Client(
        name=data['name'],
        email=data['email'],
        phone=data.get('phone'),
        company=data.get('company'),
        business_type=data.get('business_type'),
        website=data.get('website'),
        created_by=user_id,
        notes=data.get('notes')
    )
    db.session.add(client)
    db.session.commit()
    return jsonify(client.to_dict()), 201

@app.route('/api/projects', methods=['GET'])
@jwt_required()
def get_projects():
    page = request.args.get('page', 1, type=int)
    status = request.args.get('status')
    query = Project.query
    if status:
        query = query.filter_by(status=status)
    projects = query.paginate(page=page, per_page=10)
    return jsonify({
        'projects': [p.to_dict() for p in projects.items],
        'total': projects.total,
        'pages': projects.pages,
        'current_page': page
    }), 200

@app.route('/api/projects', methods=['POST'])
@jwt_required()
def create_project():
    data = request.get_json()
    user_id = get_jwt_identity()
    project = Project(
        name=data['name'],
        client_id=data['client_id'],
        created_by=user_id,
        status=data.get('status', 'planning'),
        priority=data.get('priority', 'medium'),
        budget=data.get('budget'),
        funnel_type=data.get('funnel_type'),
        description=data.get('description')
    )
    db.session.add(project)
    db.session.commit()
    return jsonify(project.to_dict()), 201

@app.route('/api/funnels/<int:project_id>', methods=['GET'])
def get_funnel_data(project_id):
    """Obtener datos del funnel de un proyecto"""
    funnel = FunnelData.query.filter_by(project_id=project_id).first()
    if not funnel:
        return jsonify({'error': 'Funnel no encontrado'}), 404
    return jsonify(funnel.to_dict()), 200

@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def dashboard_stats():
    total_clients = Client.query.count()
    total_projects = Project.query.count()
    active_projects = Project.query.filter_by(status='in_progress').count()
    completed_projects = Project.query.filter_by(status='completed').count()

    projects_by_status = {}
    for status in ['planning', 'in_progress', 'review', 'completed', 'paused']:
        projects_by_status[status] = Project.query.filter_by(status=status).count()

    return jsonify({
        'total_clients': total_clients,
        'total_projects': total_projects,
        'active_projects': active_projects,
        'completed_projects': completed_projects,
        'projects_by_status': projects_by_status
    }), 200

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'No encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Error interno del servidor'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
