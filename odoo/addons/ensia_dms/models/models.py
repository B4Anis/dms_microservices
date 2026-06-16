from odoo import models, fields


class EnsiaDmsCategory(models.Model):
    _name = 'ensia.dms.category'
    _description = 'DMS Category'
    _rec_name = 'name'
    _order = 'name'

    name = fields.Char(string='Name', required=True)
    active = fields.Boolean(string='Active', default=True)


class EnsiaDmsDepartment(models.Model):
    _name = 'ensia.dms.department'
    _description = 'DMS Department'
    _rec_name = 'name'
    _order = 'name'

    name = fields.Char(string='Name', required=True)
    active = fields.Boolean(string='Active', default=True)
    user_ids = fields.Many2many(
        comodel_name='res.users',
        relation='ensia_dms_department_users_rel',
        column1='department_id',
        column2='user_id',
        string='Users',
    )


class EnsiaDmsDocument(models.Model):
    _name = 'ensia.dms.document'
    _description = 'DMS Document'
    _rec_name = 'name'
    _order = 'name'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Name', required=True, tracking=True)
    department_ids = fields.Many2many(
        comodel_name='ensia.dms.department',
        relation='ensia_dms_document_department_rel',
        column1='document_id',
        column2='department_id',
        string='Departments',
    )
    category_id = fields.Many2one(
        comodel_name='ensia.dms.category',
        string='Category',
        ondelete='set null',
        tracking=True,
    )
