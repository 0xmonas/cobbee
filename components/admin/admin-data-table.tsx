"use client"

import { ReactNode } from 'react'

export interface ColumnConfig<T> {
  header: string
  align?: 'left' | 'center' | 'right'
  render: (item: T) => ReactNode
}

interface AdminDataTableProps<T> {
  title: string
  data: T[]
  columns: ColumnConfig<T>[]
  emptyMessage?: string
  emptySubMessage?: string
  getRowKey: (item: T) => string
}

/**
 * Generic Admin Data Table Component
 *
 * Reusable table for admin pages (users, supporters, etc.)
 * Handles data display with configurable columns and neo-brutalist styling
 */
export function AdminDataTable<T>({
  title,
  data,
  columns,
  emptyMessage = 'No data found',
  emptySubMessage,
  getRowKey,
}: AdminDataTableProps<T>) {
  return (
    <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="bg-[#CCFF00] border-b-4 border-black p-4">
        <h2 className="text-2xl font-black">{title}</h2>
      </div>
      <div className="p-6">
        {data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl font-bold text-gray-500">{emptyMessage}</p>
            {emptySubMessage && (
              <p className="text-sm text-gray-400 font-bold mt-2">
                {emptySubMessage}
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-4 border-black">
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className={`p-4 font-black ${
                        column.align === 'center'
                          ? 'text-center'
                          : column.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr
                    key={getRowKey(item)}
                    className="border-b-2 border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className={`p-4 ${
                          column.align === 'center'
                            ? 'text-center'
                            : column.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {column.render(item)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
