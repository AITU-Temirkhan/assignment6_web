var sorted = {};   // which rooms are sorted now
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
  $('.popup, .flying').stop(true).remove();   // no old cards or flying ghosts
  sorted = {};
  $('#house').empty();
  [2, 1].forEach(function (floor) {
    var $floor = $('<div class="floor" id="floor' + floor + '"><div class="label">FLOOR ' + floor + '</div></div>').appendTo('#house');
    PARTY.filter(function (r) { return r.floor === floor; }).forEach(function (r) {
      var $room = $('<div class="room" id="' + r.id + '"><h3>' + r.name + '<button class="sort">Sort by time</button></h3><div class="guests"></div></div>')
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
  // Spotlight: the guests that are not found become pale (20%). Found rooms -> their guests stay bright.
  var bright = found.is('.room') ? found.find('.guest') : found;
  $('.guest').not(bright).children('.inner').stop(true).fadeTo(300, 0.2);
  found.filter('.guest').animate({ top: -20 }, 150).animate({ top: 0 }, 150);   // jump once
  if (c.after) c.after(found);
  var names = found.map(function () { return $(this).data('name'); }).get().join(', ');
  $('#result').contents().first().replaceWith(found.length + ' found: ' + names + ' ');
}

/* ---------- 2. Guest card: grows from the avatar ---------- */
var WORDS = { phone: 'a phone', glasses: 'glasses', bag: 'a bag', cup: 'a cup', crumbs: 'cake crumbs' };

function cardHtml($g) {
  var things = String($g.data('things')).split(' ').filter(Boolean).map(function (t) { return WORDS[t]; });
  var has = things.length ? 'Has ' + things.join(', ').replace(/, ([^,]*)$/, ' and $1') : 'Has nothing with them';
  var here = $g.closest('.room');
  var html = '<h4>' + $g.data('name') + ' <small>' + here.data('name') + '</small></h4>' +
    '<p>Came at ' + $g.data('time') + '</p>' +
    '<p>' + ($g.hasClass('aitu') ? 'AITU student' : 'Not an AITU student') + '</p>' +
    '<p>Wears ' + $g.data('color') + '</p><p>' + has + '</p>';
  PARTY.forEach(function (r) {     // one button for each OTHER room
    if (r.id !== here.attr('id')) html += '<button data-to="' + r.id + '">Move to the ' + r.name.toLowerCase() + '</button>';
  });
  return html;
}

function openCard($g) {
  $('.popup').stop(true).remove();                        // only one card can be open
  var av = $g.find('.av'), o = av.offset(), s = av.outerWidth();
  var $p = $('<div class="popup">' + cardHtml($g) + '</div>').data({ name: $g.data('name'), av: av }).appendTo('body');
  var W = $p.outerWidth(), H = $p.outerHeight();          // full size
  var left = Math.max(8, Math.min(o.left + s / 2 - W / 2, $(window).width() - W - 8));
  var top = Math.max(8, o.top + s / 2 - H / 2);
  $p.css({ left: o.left, top: o.top, width: s, height: s, opacity: 0 })           // start: small, on the photo
    .animate({ left: left, top: top, width: W, height: H, opacity: 1 }, 300);     // grow
}

function closeCard() {
  var $p = $('.popup').not('.closing');
  if (!$p.length) return;
  var av = $p.data('av'), o = av.offset();
  $p.addClass('closing').stop(true)                                                // stop() = no queue
    .animate({ left: o.left, top: o.top, width: av.outerWidth(), height: av.outerHeight(), opacity: 0 }, 250,
             function () { $(this).remove(); });                                   // shrink back into the photo
}

/* ---------- 3. Move a guest to another room ---------- */
function moveGuest(name, toId) {
  $('.popup').stop(true).remove();
  var $g = $('.guest[data-name="' + name + '"]'), from = $g.offset(), w = $g.outerWidth();

  PARTY.forEach(function (r) {                            // change the array too
    var i = r.guests.findIndex(function (g) { return g.name === name; });
    if (i > -1) PARTY.find(function (x) { return x.id === toId; }).guests.push(r.guests.splice(i, 1)[0]);
  });

  var $gap = $('<div class="gap">').width(w).insertAfter($g);                      // empty place in the old room
  var $ghost = $g.clone().removeClass('guest').addClass('flying').css({ left: from.left, top: from.top }).appendTo('body');
  $g.css({ visibility: 'hidden', width: 0 }).appendTo('#' + toId + ' .guests');    // new place (closed) at the end

  $gap.animate({ width: 0 }, 800, function () { $(this).remove(); });              // old room closes the gap
  $g.animate({ width: w }, 800);                                                   // new room opens a place
  $({ t: 0 }).animate({ t: 1 }, {                                                  // the ghost flies: t goes 0 -> 1
    duration: 800,
    step: function (t) {
      var to = $g.offset();                                                        // where the new place is NOW
      $ghost.css({ left: from.left + (to.left - from.left) * t, top: from.top + (to.top - from.top) * t });
    },
    complete: function () { $ghost.remove(); $g.css('visibility', 'visible'); }
  });
}

/* ---------- 4. Sort a room by time (own queue "sort") ---------- */
function sortRoom(roomId) {
  var $cards = $('#' + roomId + ' .guests').children('.guest');
  var names = PARTY.find(function (r) { return r.id === roomId; }).guests.map(function (g) { return g.name; });
  sorted[roomId] = !sorted[roomId];                       // click again = back to the picture order
  var key = function (el) {
    var i = names.indexOf($(el).data('name'));
    return sorted[roomId] ? $(el).data('min') : (i < 0 ? 99 : i);
  };
  var old = $cards.map(function () { return $(this).offset(); }).get();           // where the cards are now
  $cards.stop('sort', true).css({ left: 0, top: 0 });                              // stop only the sort animation
  $('#' + roomId + ' .guests').append($cards.get().sort(function (a, b) { return key(a) - key(b); }));
  $cards.each(function (i) {
    var now = $(this).offset();                           // new place
    $(this).css({ left: old[i].left - now.left, top: old[i].top - now.top })      // put the card back where it was...
      .animate({ left: 0, top: 0 }, { duration: 700, queue: 'sort' }).dequeue('sort');   // ...and slide it to the new place
  });
}

$(function () {
  buildPage();
  $.each(CASES, function (i, c) {
    $('<button>').text((i + 1) + '. ' + c.q).appendTo('#cases').on('click', function () { runCase(c); });
  });

  // events
  $('#clear').on('click', function () {
    $('.guest .inner').stop(true).fadeTo(300, 1);
    $('.found').removeClass('found');
    $('#result').contents().first().replaceWith('Cleared. ');
  });
  $('#house').on('click', '.guest', function () {
    var open = $('.popup').not('.closing');
    if (open.data('name') === $(this).data('name')) closeCard(); else openCard($(this));
  });
  $('#house').on('click', '.sort', function () {
    $(this).toggleClass('on'); sortRoom($(this).closest('.room').attr('id'));
  });
  $(document).on('click', '.popup button', function () {
    moveGuest($(this).closest('.popup').data('name'), $(this).data('to'));
  });
  $(document).on('click', function (e) {                  // click outside the card
    if (!$(e.target).closest('.popup, .guest').length) closeCard();
  });
  $(document).on('keydown', function (e) { if (e.key === 'Escape') closeCard(); });
});
