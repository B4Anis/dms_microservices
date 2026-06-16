import React, { useEffect, useState } from 'react';
import Card from '../common/Card';
import DropdownMenu from '../common/DropdownMenu';
import { departmentService } from '../../services/departmentService';
import { userService } from '../../services/userService';

const DepartmentCard = ({ department, onEdit, onDelete, onViewUsers }) => {
  const [userCount, setUserCount] = useState(0);
  const [managerName, setManagerName] = useState('Unassigned');

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const users = await departmentService.getDepartmentUsers(department.id);
        if (isMounted) setUserCount(users.length);

        if (department.managerId) {
          const manager = await userService.getUserById(department.managerId);
          if (isMounted) setManagerName(`${manager.firstName} ${manager.lastName}`);
        }
      } catch (e) {
        console.error('Failed to fetch department stats', e);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [department]);

  return (
    <Card className="hover:shadow-md transition-shadow relative overflow-hidden group border border-gray-200">
      {/* Color indicator bar */}
      <div 
        className="absolute top-0 left-0 w-full h-1" 
        style={{ backgroundColor: department.color || '#3B82F6' }}
      />
      
      <div className="flex justify-between items-start mb-4 mt-2">
        <div className="flex items-center gap-2">
          {department.icon && <span className="text-xl">{department.icon}</span>}
          <h3 className="text-lg font-bold text-gray-900 truncate" title={department.name}>
            {department.name}
          </h3>
        </div>
        <DropdownMenu 
          trigger={
            <button className="text-gray-400 hover:text-gray-600 focus:outline-none -mr-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
            </button>
          }
          items={[
            { label: 'View Users', onClick: () => onViewUsers(department) },
            { label: 'Edit Department', onClick: () => onEdit(department) },
            { label: 'Archive / Delete', onClick: () => onDelete(department, userCount) }
          ]}
        />
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 h-10 mb-4" title={department.description}>
        {department.description || 'No description provided.'}
      </p>

      <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mb-2 text-sm">
        <div>
          <p className="text-gray-500 text-xs uppercase font-medium tracking-wider mb-1">Manager</p>
          <p className="font-medium text-gray-900 truncate">{managerName}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-medium tracking-wider mb-1">Employees</p>
          <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600" onClick={() => onViewUsers(department)}>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-medium">{userCount}</span>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-400 text-right mt-2">
        Created {new Date(department.createdAt).toLocaleDateString()}
      </div>
    </Card>
  );
};

export default DepartmentCard;
