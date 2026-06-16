{
    'name': 'ENSIA DMS',
    'version': '15.0.1.0.0',
    'category': 'Document Management',
    'summary': 'ENSIA Document Management System for Enterprise Computing Lab',
    'author': 'ENSIA',
    'depends': ['base', 'mail'],
    'data': [
        'security/security.xml',
        'security/ir.model.access.csv',
        'views/views.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
