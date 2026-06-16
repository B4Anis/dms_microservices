# -*- coding: utf-8 -*-

from datetime import datetime
from datetime import timedelta 
from odoo.tools import DEFAULT_SERVER_DATE_FORMAT,DEFAULT_SERVER_DATETIME_FORMAT
from odoo import api, models,fields
from odoo.exceptions import UserError
from odoo import exceptions
import logging
_logger = logging.getLogger(__name__) 



class ProcessInspectRejectWiz(models.TransientModel):
	_name='module.skeleton.some.action.wiz'
	
	skeleton_id=fields.Many2one('module.skeleton',string='Skeleton')	
	message=fields.Text(string='Message')

 
	def action_process(self):
		self.ensure_one()
		#do some processing here....
