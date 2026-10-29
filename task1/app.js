var ICONS = { phone: '📱', glasses: '👓', bag: '👜', cup: '☕', crumbs: '🍰' };

function toMin(time) {                       // "20:45" -> 1245 minutes
  var p = time.split(':');
  return p[0] * 60 + Number(p[1]);
}

// One guest card. The data is stored as classes and data-* attributes.
function makeCard(g) {
  var cls = 'guest' + (g.aitu ? ' aitu' : '') + g.things.map(function (t) { return ' has-' + t; }).join('');
  var icons = g.things.map(function (t) { return '<span>' + ICONS[t] + '</span>'; }).join('');
  var badge = g.aitu ? '<i class="badge">🎓</i>' : '';
  var avatar = 'https://api.dicebear.com/9.x/open-peeps/svg?seed=' + g.name;
  return $('<div>').addClass(cls).attr({
    'data-name': g.name, 'data-color': g.color, 'data-time': g.time,
    'data-min': toMin(g.time), 'data-things': g.things.join(' ')
  }).html('<div class="inner"><div class="av"><img src="' + avatar + '" alt="">' + badge + '</div>' +
          '<b>' + g.name + '</b><small>🕒 ' + g.time + '</small><div class="things">' + icons + '</div></div>');
}

// Build the whole house from the PARTY array.
function buildPage() {
  $('#house').empty();
  [2, 1].forEach(function (floor) {
    var $floor = $('<div class="floor" id="floor' + floor + '"><div class="label">FLOOR ' + floor + '</div></div>').appendTo('#house');
    PARTY.filter(function (r) { return r.floor === floor; }).forEach(function (r) {
      var $room = $('<div class="room" id="' + r.id + '"><h3>' + r.name + '</h3><div class="guests"></div></div>')
        .attr('data-name', r.name).appendTo($floor);
      r.guests.forEach(function (g) { makeCard(g).appendTo($room.find('.guests')); });
    });
  });
}

// Run one case: rebuild the page, find, highlight, jump, show the answer.
function runCase(c) {
  buildPage();
  var found = c.run();
  found.addClass('found');
  found.filter('.guest').animate({ top: -20 }, 150).animate({ top: 0 }, 150);   // jump once
  if (c.after) c.after(found);
  var names = found.map(function () { return $(this).data('name'); }).get().join(', ');
  $('#result').text(found.length + ' found: ' + names);
}

$(function () {
  buildPage();
  $.each(CASES, function (i, c) {
    $('<button>').text((i + 1) + '. ' + c.q).appendTo('#cases').on('click', function () { runCase(c); });
  });
});
