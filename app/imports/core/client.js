import './lib/css/animations.css';
import './lib/css/select2.min.css';
import './lib/css/select2-bootstrap.min.css';
import './lib/css/modals.css';

import './lib/js/jquery.appear.js';
import './lib/js/respond.min.js';
import './lib/js/select2.min.js';
import './lib/js/select2.el.min.js';
import './lib/js/readmore.min.js';

import './lib/views/common.js';
import './lib/views/providers.html';
import './lib/views/providers.js';
import './lib/views/tmplCommon.js';
import './lib/views/profile.html';
import './lib/views/profile.js';
import './lib/views/profile.css';

import './lib/components/messages.html';
import './lib/components/messages.js';
import './lib/components/messages.less';

import './lib/collections/bookings.js';
import './lib/collections/contact.js';
import './lib/views/contact.html';
import './lib/views/contact.js';
import './lib/collections/specialities.js';
import './lib/collections/files.js';
import './lib/collections/messages.js';
import './lib/collections/questions.js';
import './lib/collections/templates.js';
import './lib/collections/private.js';
import './lib/collections/expertise.js';

import 'sweetalert/dist/sweetalert.css';

// add collection helpers after publications
import './lib/collections/helpers.js';

// Export collections, in order to be used by other packages
// export default imCore;
export {Bookings, Contact, Specialities, Images, Messages, UserFiles, Questions, NotificationTemplates, Private, Logs};

export { appClient };
