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


class SkeletonLine(models.Model):
	_name = 'module.skeleton.line'

	skeleton_id = fields.Many2one('module.skeleton', string='skeleton',required=True)
	name=fields.Char('Name')
