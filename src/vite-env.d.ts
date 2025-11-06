/// <reference types="react-scripts/cra-template-types" />

namespace NodeJS {
  interface ProcessEnv {
    readonly REACT_APP_STACK_PROJECT_ID: string
    readonly REACT_APP_STACK_PUBLISHABLE_CLIENT_KEY: string
    readonly REACT_APP_RECAPTCHA_SITE_KEY: string
    readonly REACT_APP_APP_NAME: string
    readonly REACT_APP_APP_DESCRIPTION: string
    readonly REACT_APP_APP_URL: string
    readonly REACT_APP_STRIPE_PUBLISHABLE_KEY: string
    readonly REACT_APP_STRIPE_PRICE_ID: string
    readonly REACT_APP_API_BASE_URL: string
    readonly REACT_APP_NODE_ENV: string
  }
}
