<p align="center">
  <img style="height:100px;display:inline-block;" src="app/public/images/logo.png" />
  <div align="center">
    <strong><h1>Paid video call scheduling made simple</h1></strong>
  </div>
  <div align="center"><h2>MeetPro is a service that helps you expand your online business<br> with easy-to-use appointment scheduling, video calling, and instant payments.</h2></div>
</p>

<br><br>
# Getting Started

## 🏢 **Self-Hosted**

You can install MeetPro yourself. It's free, but you are responsible for managing it. See [here](#reasons-for-open-sourcing). 

### Here's how:  ###

* [Clone](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) this repo to your server
* Ensure [Docker](https://docs.docker.com/engine/install/ubuntu/) & Docker Compose are installed at your server
* Create app/settings.json (copy from app/settings-sample.json). See [here](#settings).
* Create .env (copy from .env-sample and replace your app deployment url in APP_ROOT_URL)
* Run ``deploy.sh``
* Go to your APP_ROOT_URL and login with:
* Username: the email you set at the settings' ADMIN_EMAIL and password: mypass@321
<br>

### Demo ###
A demo of the app in dev mode can be found at:
http://54.37.17.142:8000

- Admin: admin@someapp.com
- Expert: expert@someapp.com
- User: user@someapp.com

Password for all: mypass@321

### Created accounts ###

#### - When APP_MODE is set to 'dev' ####

* Admin with login email: the email you set in settings' ADMIN_EMAIL
* User with login email: user@domain (where domain is the url part of ADMIN_EMAIL - after the @)
* Expert with login email: expert@domain
* Password (for all users & admin): mypass@321
* Lots of test data (bookings, users & experts)

#### - When APP_MODE is set to: 'production' ####

* Admin with login email: the email you set in settings' ADMIN_EMAIL & password: mypass@321
<br>

### Update App ###
* Stop app: ``docker compose down``
* Update: ``docker compose pull``
* Restart: ``./deploy.sh``

<br><br>
## Development setup ##
### 1. Install Meteor ###

* Install meteor: ``https://www.meteor.com/developers/install``

### 2. Install npm dependencies ###

* ``meteor npm install``

### 3. Run (on all platforms) ###

* ``meteor --settings settings.json``
* Alternatively, run ``./dev-run.sh`` on Linux/Mac OS, ``dev-run.bat`` on Windows 

### Reset Database (erase all data & get new data from core/server/fixtures.js) ###

* ``meteor reset``

<br><br>

### Settings ###
#### Essential ####
* APP_NAME: The displayed app name
* APP_URL: The URL in which the app is deployed
* APP_MODE: **dev** or **production**  (dev creates sample data, adds test chat button @ dashboard & implements all payments in Sandbox)
* ADMIN_EMAIL: The admin's email,
* SRV_TZ: Server's timezone e.g. Europe/London,
* EMAIL_URL: Set your email env variable. See [here](https://docs.meteor.com/environment-variables.html#MAIL-URL) for help,
#### Optional ####
* JITSI_SERVER: Address of Jitsi Server (without http, leave "meet.jit.si" if you host a small number of video calls)
* face2face: Set to true to enable ability to book face to face appointments (instead of just video calls),
* DEFAULT_LANG: Set to "en" *(to be expanded, only English & Greek available)*,
* CLICKATELL_AUTH_TOKEN: [Token](https://docs.clickatell.com/technical-faq/api-faq/what-is-my-api-key/) to send SMS via Click-a-tell *(needs an account with SMS credits)*,
#### Social logins ####
*see [here](https://guide.meteor.com/accounts.html#oauth) for more info*
* FB_APPID,FB_SECRET: ID & Secret to Facebook app,
* GOOGLE_CID, GOOGLE_SECRET: Google ID & Secret,

#### Experimental - under construction ####
* messagesEnabled: Enables messages between users. Set to false _(feature under construction)_,
* filesEnabled: Enable file upload. Set to false *(feature under construction)*,
* REST_BEARER_TOKEN: Leave blank if not using REST API
* GoogleAccessId: ID to upload files to Google *(experimental)*
* reCaptcha: Google login reCaptcha setup (see [here](https://github.com/meteor-useraccounts/core/blob/master/Guide.md#reCaptcha-setup))

## Reasons for open sourcing ##
Despite our best efforts to establish MeetPro as a robust SaaS offering, various challenges prevented us from realizing this vision. From resource constraints to market complexities, the path forward became increasingly difficult. Believing in the potential of this tool and its potential to benefit the community, we've decided to open-source MeetPro. By sharing the codebase, we hope to empower developers and organizations to build upon our work, fostering innovation and collaboration. If you find MeetPro valuable and are willing to extend its capabilities, we encourage you to share your improvements with the community. Your contributions can help shape the future of this project.