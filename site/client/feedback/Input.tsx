import * as React from 'react'

import FormSection from './FormSection'

interface Props {
    id: string
    children: React.ReactChild
}

export default ({
    id,
    children,
    ...inputProps
}: Props & React.InputHTMLAttributes<HTMLInputElement>) => (
    <FormSection id={id} label={children}>
        <input id={id} {...inputProps} />
    </FormSection>
)
