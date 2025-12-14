import type { EmailServicePort } from '../../../application/ports/email.service.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { Resend } from 'resend'
import { obscured } from 'obscured'
import type { Obscured } from 'obscured'
import { ExternalServiceException } from '../../../shared/exceptions/external-service.exception.js'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'

export class ResendService implements EmailServicePort {
  constructor(
    private readonly apiKey: Obscured<string | undefined>,
    private readonly logger: LoggerPort
  ) {}

  static registerResendClient(apiKey: Obscured<string | undefined>): Resend {
    return new Resend(obscured.value(apiKey)) as Resend
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    this.logger.info('Sending welcome email', { to, name })

    const emailData = {
      from: EnvConfig.EMAIL_FROM_ADDRESS,
      to,
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
    }

    const { data, error } = await ResendService.registerResendClient(this.apiKey).emails.send(
      emailData
    )

    if (error) {
      this.logger.error('Failed to send welcome email', new Error(error.message), { to, name })
      throw new ExternalServiceException('Failed to send welcome email', { error })
    }

    if (data) {
      this.logger.info('Email sent successfully', { id: data.id, to, name })
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    this.logger.info('Sending password reset email', { to })

    const emailData = {
      to,
      from: 'noreply@gym.com',
      subject: 'Reset Your Password',
      html: `<p>Click here to reset: <a href="https://gym.com/reset/${resetToken}">Reset Password</a></p>`,
    }

    // await this.sendGridClient.send(emailData)
    this.logger.info('Password reset email sent', { to })
  }
}
