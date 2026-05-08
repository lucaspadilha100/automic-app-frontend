import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { FieldError } from 'react-hook-form'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: FieldError
  hint?: string
}
export function FormField({ label, error, hint, className = '', ...props }: FormFieldProps) {
  return (
    <div>
      {label && <label className="label">{label}{props.required && <span className="text-red-500 ml-1">*</span>}</label>}
      <input className={`input ${error ? 'input-error' : ''} ${className}`} {...props} />
      {error && <p className="text-xs text-red-500 mt-1">{error.message}</p>}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: FieldError
  placeholder?: string
}
export function SelectField({ label, error, placeholder, children, className = '', ...props }: SelectFieldProps) {
  return (
    <div>
      {label && <label className="label">{label}{props.required && <span className="text-red-500 ml-1">*</span>}</label>}
      <select className={`input ${error ? 'input-error' : ''} ${className}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error.message}</p>}
    </div>
  )
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: FieldError
}
export function TextareaField({ label, error, className = '', ...props }: TextareaFieldProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <textarea rows={3} className={`input ${error ? 'input-error' : ''} ${className}`} {...props} />
      {error && <p className="text-xs text-red-500 mt-1">{error.message}</p>}
    </div>
  )
}
