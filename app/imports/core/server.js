import './lib/collections/bookings.js';
import './lib/collections/contact.js';
import './lib/collections/specialities.js';

import './lib/collections/files.js';
import './lib/collections/messages.js';
import './lib/collections/questions.js';
import './lib/collections/templates.js';
import './lib/collections/private.js';
import './lib/collections/expertise.js';
import './lib/collections/server.js';

import './lib/server/common.js';
import './lib/server/fixtures.js';
import './lib/server/faker.js';
import './lib/server/publications.js';
import './lib/server/methods.js';
import './lib/server/startup.js';
import './lib/server/accounts.js';
import './lib/server/social.js';
import './lib/server/rest.js';
import './lib/server/subs.js';
import './lib/server/usage.js';
import './lib/server/ssr.js';

// add collection helpers after publications
import './lib/collections/helpers.js';

// Export collections, in order to be used by other packages
export {Bookings , Contact, Specialities, Images, Messages, UserFiles, Questions, NotificationTemplates, Private, Logs};
