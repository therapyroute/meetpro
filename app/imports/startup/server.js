import './lib/routes.js';
import './lib/collections/users.js';

// add collection helpers after publications
import './lib/server/startup.js';
import './lib/collections/helpers.js';
import './lib/collections/params.js';
import './lib/server/methods.js';

// Export collections, in order to be used by other packages
export {appCommon};
