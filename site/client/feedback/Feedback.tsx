import React = require('react')
import ReactDOM = require('react-dom')
import { observer } from 'mobx-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons/faEnvelope'
import { observable, action, toJS } from 'mobx'
import classnames from 'classnames'

import Input from './Input'
import TextArea from './TextArea'

function sendFeedback(feedback: Feedback) {
    return new Promise((resolve, reject) => {
        const json = toJS(feedback)
        const req = new XMLHttpRequest()

        json.message =
            feedback.message +
            `\n\n-----\nCurrent URL: ${window.location.href}`

        req.addEventListener('readystatechange', () => {
            if (req.readyState === 4) {
                if (req.status !== 200) {
                    reject(`${req.status} ${req.statusText}`)
                } else {
                    resolve()
                }
            }
        })

        req.open(
            'POST',
            `https://owid-feedback.netlify.com/.netlify/functions/hello`
        )
        req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')

        req.send(JSON.stringify(json))
    })
}

class Feedback {
    @observable name: string = ''
    @observable email: string = ''
    @observable message: string = ''
}

@observer
export class FeedbackForm extends React.Component<{ onDismiss: () => void }> {
    feedback: Feedback = new Feedback()
    @observable loading: boolean = false
    @observable done: boolean = false
    @observable error: string | undefined
    dismissable: boolean = true

    async submit() {
        try {
            await sendFeedback(this.feedback)
            this.done = true
        } catch (err) {
            this.error = err
        } finally {
            this.loading = false
        }
    }

    @action.bound onDismiss(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        this.props.onDismiss()
    }

    @action.bound onClickSomewhere() {
        if (this.dismissable) {
            this.props.onDismiss()
        } else {
            this.dismissable = true
        }
    }

    componentDidMount() {
        document.addEventListener('click', this.onClickSomewhere)
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.onClickSomewhere)
    }

    @action.bound onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        this.done = false
        this.error = undefined
        this.loading = true
        this.submit()
    }

    @action.bound onName(e: React.ChangeEvent<HTMLInputElement>) {
        this.feedback.name = e.currentTarget.value
    }

    @action.bound onEmail(e: React.ChangeEvent<HTMLInputElement>) {
        this.feedback.email = e.currentTarget.value
    }

    @action.bound onMessage(e: React.ChangeEvent<HTMLTextAreaElement>) {
        this.feedback.message = e.currentTarget.value
    }

    render() {
        const { loading } = this
        return (
            <form
                className={classnames(
                    'w-84 shadow-xl rounded-lg overflow-hidden',
                    {
                        'opacity-50': this.loading
                    }
                )}
                onSubmit={this.onSubmit}
                onClick={action(() => (this.dismissable = false))}
            >
                <header className="p-5 bg-owid-blue text-white text-center text-lg">
                    Leave us feedback
                </header>
                <div className="p-3 text-gray-700">
                    <Input
                        autoFocus
                        disabled={loading}
                        id="feedback.name"
                        onChange={this.onName}
                    >
                        Your name
                    </Input>
                    <Input
                        disabled={loading}
                        id="feedback.email"
                        onChange={this.onEmail}
                        required
                        type="email"
                    >
                        Email address
                    </Input>
                    <TextArea
                        disabled={loading}
                        id="feedback.message"
                        onChange={this.onMessage}
                        required
                        rows={5}
                    >
                        Message
                    </TextArea>
                    {this.error ? (
                        <div style={{ color: 'red' }}>{this.error}</div>
                    ) : (
                        undefined
                    )}
                    {this.done ? (
                        <div style={{ color: 'green' }}>
                            Thanks for your feedback!
                        </div>
                    ) : (
                        undefined
                    )}
                </div>
                <footer>
                    <button onClick={this.onDismiss} disabled={loading}>
                        Close
                    </button>
                    <button type="submit" disabled={loading}>
                        Send
                    </button>
                </footer>
            </form>
        )
    }
}

@observer
class FeedbackPrompt extends React.Component {
    @observable isOpen: boolean = false

    @action.bound toggleOpen() {
        this.isOpen = !this.isOpen
    }

    render() {
        return this.isOpen ? (
            <FeedbackForm onDismiss={this.toggleOpen} />
        ) : (
            <button className="FeedbackPrompt" onClick={this.toggleOpen}>
                <FontAwesomeIcon icon={faEnvelope} /> Feedback
            </button>
        )
    }
}

export function runFeedback() {
    ReactDOM.render(
        <FeedbackPrompt />,
        document.querySelector('.feedbackPromptContainer')
    )
}

export function runFeedbackPage() {
    ReactDOM.render(
        <FeedbackForm onDismiss={() => undefined} />,
        document.querySelector('.FeedbackPage main')
    )
}
