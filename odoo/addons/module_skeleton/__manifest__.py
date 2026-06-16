# -*- coding: utf-8 -*-
{
    'name': "Module Skeleton",
    'summary': "Module Skeleton",
    'description': """
		Module Skeleton
    """, 
    'price':600000,
    'currency':'EUR' ,
    'author': "Imed Bouchrika",
    'website': "http://www.imed.ws",
    'category': 'Project', 
    'version': '11.0.1.3',   
    'depends': [
		'base',
		'account',
		'sale',
		'stock',
	],
    'data': [
		'security/security.xml',
		'views/skeleton.xml',
		'views/skeleton_line.xml',
		'views/wiz.xml',
		'views/menu.xml', 
		'data/seq.xml', 
		'data/cron.xml', 
		'security/ir.model.access.csv',   
    ],
    'installable': True,
    'application': True,   
    'auto_install': False,
}

