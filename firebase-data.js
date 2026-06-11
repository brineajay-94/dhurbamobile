var fb_listeners = {};

function fb_convertSnapshot(snap) {
  var obj = snap.val();
  if (!obj) return [];
  return Object.keys(obj).map(function (k) {
    var item = obj[k];
    item.id = k;
    return item;
  });
}

function fb_on(entity, callback) {
  var ref = db.ref(entity);
  var fn = ref.on('value', function (snap) {
    callback(fb_convertSnapshot(snap));
  });
  fb_listeners[entity] = { ref: ref, fn: fn };
  return function () { ref.off('value', fn); };
}

function fb_off(entity) {
  if (fb_listeners[entity]) {
    fb_listeners[entity].ref.off('value', fb_listeners[entity].fn);
    delete fb_listeners[entity];
  }
}

function fb_save(entity, id, data) {
  var ref = id ? db.ref(entity + '/' + id) : db.ref(entity).push();
  return ref.set(data);
}

function fb_delete(entity, id) {
  return db.ref(entity + '/' + id).remove();
}

function fb_getOnce(entity, callback) {
  db.ref(entity).once('value', function (snap) {
    callback(snap.val());
  });
}
