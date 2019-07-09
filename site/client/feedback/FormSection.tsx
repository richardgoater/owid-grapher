import * as React from 'react'

interface Props {
    id: string
    label: React.ReactChild
    children: React.ReactElement
}

export default ({ id, label, children }: Props) => (
    <div className="mb-6">
        <label htmlFor={id} className="leading-loose">
            {label}
        </label>
        {React.cloneElement(children, {
            className:
                'block border border-gray-400 py-2 px-4 w-full rounded text-sm outline-none'
        })}
    </div>
)
