# -*- coding: utf-8 -*-
from odoo import SUPERUSER_ID
from num2words import num2words
from odoo import api, models,fields
from odoo.exceptions import UserError 
from odoo import exceptions
from datetime import datetime
import math
import random,string
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT, float_compare
import logging
import json

_logger = logging.getLogger(__name__)


class Skeleton(models.Model):
	_name = 'module.skeleton'
	_inherit=['mail.thread']
	_description = "Skeleton"	
	_order = 'name asc'


	active = fields.Boolean('Active', default=True)
	state=fields.Selection([
		('draft','Draft'),
		('done','Done')],string='State',default='draft') 
	name = fields.Char(string='Nom', required=False, copy=False, readonly=True, index=True, default=lambda self: 'New',track_visibility='onchange')
	date=fields.Date('Date',default=fields.Date.today())

	image_small = fields.Binary("Image", attachment=True)	
	description=fields.Char(string='Description')
	company_id = fields.Many2one('res.company', 'Entreprise Locale')
		
	attachment_number = fields.Integer(compute='_compute_attachment_number', string='P.J.')	

	line_ids=fields.One2many('module.skeleton.line','skeleton_id',string='Lines')
	lines_count=fields.Integer('#Lines',store=True,compute='_compute_lines_count')

	@api.depends('line_ids')
	def _compute_lines_count(self):
		for rec in self:
			rec.lines_count=len(rec.line_ids)
			
	def action_hello(self):
		_logger.debug('hello')	
		
	def action_done(self):
		for rec in self:
			if rec.name =='New':
				tmp = self.env['ir.sequence'].next_by_code('module.skeleton.sequence')
				rec.name=tmp	
			rec.state='done'


	def action_open_wiz(self):
		self.ensure_one()
		view_id=self.env['module.skeleton.some.action.wiz']		
		new = view_id.create({'skeleton_id':self.id})	
		return {
			'type': 'ir.actions.act_window',
			'name': 'Opening the WIZ',
			'res_model': 'module.skeleton.some.action.wiz', 
			'view_mode': 'form',
			'res_id'    : new.id,
			'target': 'new',		
		}
		
	def cron_update(self):
		f=1
		
	def _compute_attachment_number(self):
		attachment_data = self.env['ir.attachment'].read_group([('res_model', '=', 'module.skeleton'), ('res_id', 'in', self.ids)], ['res_id'], ['res_id'])
		attachment = dict((data['res_id'], data['res_id_count']) for data in attachment_data)
		for expense in self:
			expense.attachment_number = attachment.get(expense.id, 0)
			
			

	def action_get_attachment_view(self):
		self.ensure_one()
		res = self.env.ref('base.action_attachment').sudo().read()[0]
		res['domain'] = [('res_model', '=', 'module.skeleton'), ('res_id', 'in', self.ids)]
		res['context'] = {'create':True,'delete':True,'default_res_model': 'module.skeleton', 'default_res_id': self.id}
		return res

	def action_open_list_view(self):
		self.ensure_one()
		res = self.env.ref('module_skeleton.action_skeleton_line').sudo().read()[0]
		res['domain'] = [('skeleton_id', '=', self.id)]
		res['context'] = {'create':True,'delete':True,'default_skeleton_id': self.id}
		return res

		
	##Must be called on an object
	def api_mark_skeleton_done(self):
		for rec in self:
			if rec.state=='draft':
				rec.state='done'

	##Belongs to the class 
	@api.model
	def api_get_skeleton_documents(self,options={}):
		
		doc_list = []
		ret = {'state':200,'data':{},'message':''}
		offset=0
		pagesize=5
		sortby=options.get('sortby') or 'id'
		sortdir=options.get('sortdir') or  'DESC'
		
		if options.get('offset'):
			offset=int( options.get('offset') )
		
		if options.get('pagesize') and 	0<int(options.get('pagesize'))<100 :
			pagesize=int(options.get('pagesize'))
			
		search_domain=[]	
		if options.get('search_keywords'):
			for kv in options.get('search_keywords'):
				search_domain.append((kv['key'],kv['op'],kv['value']))
				
		docs=self.env['module.skeleton'].search(search_domain,limit=pagesize,offset=offset,order=sortby+' '+sortdir)
		docs_count=self.env['module.skeleton'].search_count(search_domain)
			
		for doc in docs:
			doc_list.append({
			'id':doc.id,
			'name':doc.name,
			'content':doc.description,
			})
			
		ret['data']['records'] = doc_list
		ret['data']['total_count']=docs_count
		ret['data']['offset']=offset
		
		_logger.debug('_________ret is equal to \n\n' + str(ret))        
		return ret
		# return 'ret'
