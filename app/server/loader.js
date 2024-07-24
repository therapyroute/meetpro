// inject loader to client using meteorhacks:inject-initial
// include header & initial loader (spinner) first (in order to immediately inject to client)
Inject.rawHead("meta", Assets.getText('initial/meta.html'));
Inject.rawHead("loader", Assets.getText('initial/loader.html'));
