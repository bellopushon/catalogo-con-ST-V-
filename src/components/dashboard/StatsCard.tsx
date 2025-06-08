import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  textColor,
  description,
  trend
}: StatsCardProps) {
  return (
    <div className={`${bgColor} rounded-2xl p-4 lg:p-6 border border-gray-100 admin-dark:border-gray-700`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend.isPositive 
              ? 'bg-green-100 text-green-800 admin-dark:bg-green-900 admin-dark:text-green-200'
              : 'bg-red-100 text-red-800 admin-dark:bg-red-900 admin-dark:text-red-200'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-600 admin-dark:text-gray-400 mb-1">{label}</p>
        <p className={`text-2xl lg:text-3xl font-bold ${textColor} mb-1`}>
          {value}
        </p>
        <p className="text-xs text-gray-500 admin-dark:text-gray-500">{description}</p>
      </div>
    </div>
  );
}
