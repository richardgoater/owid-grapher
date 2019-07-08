import * as React from 'react'

import FormSection from './FormSection'

interface Props {
    id: string
    children: React.ReactChild
}

export default ({
    id,
    children,
    ...textareaProps
}: Props & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <FormSection id={id} label={children}>
        <textarea id={id} {...textareaProps} />
    </FormSection>
)
