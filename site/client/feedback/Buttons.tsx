import * as React from 'react'
import classnames from 'classnames'

const Button = ({
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
        className={classnames(
            'p-2 w-32 rounded transition',
            className,
            'hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white'
        )}
        {...props}
    />
)

export const PrimaryButton = ({
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <Button
        className={classnames('bg-owid-blue text-white', className)}
        {...props}
    />
)

export const SecondaryButton = ({
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <Button
        className={classnames(
            'border border-blue-700 text-blue-700',
            className
        )}
        {...props}
    />
)
