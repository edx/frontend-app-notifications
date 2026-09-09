frontend-app-notifications
##########################

|license-badge| |status-badge| |ci-badge| |codecov-badge|

.. |license-badge| image:: https://img.shields.io/badge/license-AGPL-informational
    :target: https://github.com/edx/frontend-app-notifications/blob/main/LICENSE
    :alt: License

.. |status-badge| image:: https://img.shields.io/badge/Status-Maintained-brightgreen

.. |ci-badge| image:: https://github.com/edx/frontend-app-notifications/actions/workflows/ci.yml/badge.svg
    :target: https://github.com/edx/frontend-app-notifications/actions/workflows/ci.yml
    :alt: Continuous Integration

.. |codecov-badge| image:: https://codecov.io/github/edx/frontend-app-notifications/coverage.svg?branch=main
    :target: https://codecov.io/github/edx/frontend-app-notifications?branch=main
    :alt: Codecov

Purpose
=======

This repository is edX's fork of `openedx/frontend-app-notifications`_, published
to npm as ``@edx/frontend-app-notifications``. It is consumed by sites built on
`@openedx/frontend-base`_ and contributes a notifications bell widget to the
unified header's desktop and mobile right slots.

.. _openedx/frontend-app-notifications: https://github.com/openedx/frontend-app-notifications
.. _@openedx/frontend-base: https://github.com/openedx/frontend-base

Getting Started
===============

Installation
------------

Install the package into a site that uses ``@openedx/frontend-base``::

    npm install @edx/frontend-app-notifications

Then register the app's default export alongside the other ``App`` configs in
your ``site.config.*.tsx``::

    import notificationsApp from '@edx/frontend-app-notifications';
    import { shellApp, headerApp, footerApp } from '@openedx/frontend-base';

    const config: SiteConfig = {
      // ...
      apps: [shellApp, headerApp, footerApp, notificationsApp],
    };

    export default config;

Named exports (``NotificationsTray``, ``Notifications``, ``useAppNotifications``,
``useNotification``) remain available for consumers that embed the tray or its
hooks directly.

Local Development
-----------------

Clone this repository and install dependencies::

    npm install

Run the bundled dev site (shell + header + footer + this app)::

    npm run dev

To develop against a local ``frontend-base`` checkout, bind-mount it into the
workspace and run the packages-aware dev script. See the ``Makefile`` for the
``dev-packages`` and ``bin-link`` targets.

Branches and Releases
=====================

This app is published to NPM by ``semantic-release``, and its branches follow
`OEP-10 ADR 0002`_:

``main``
  Unstable.  Every merge publishes a prerelease on the ``alpha`` dist-tag.
  Breaking changes land here with no DEPR process and no warning, so it is
  not supported in production.  All changes, including bug fixes, should
  target this branch first.

``stable``
  Carries the newest stable major and owns the ``latest`` dist-tag.  Changes
  arrive here as backports from ``main``, and no breaking change lands after
  publication.

``n.x`` and ``n.m.x``
  Maintenance branches for majors and minors that ``stable`` has moved past.
  Each owns the dist-tag matching its own name, so consumers select a
  maintained line by semver range, e.g. ``"3.x"``.

Both ``.releaserc`` and the ``Release CI`` workflow already know the whole
layout, including the maintenance branch patterns, so a new line starts
publishing as soon as it is pushed.

The plugin this app replaced lives on ``2.x``, which publishes
``@edx/frontend-plugin-notifications``.  That plugin only ever worked inside the
legacy micro-frontends, and the branch keeps it maintained for as long as they
ship.  It deliberately owns the ``latest`` dist-tag of *that* package rather
than the ``2.x`` dist-tag the layout above would otherwise give it; the package
names are distinct, so the two ``latest`` tags do not collide.

.. _OEP-10 ADR 0002: https://docs.openedx.org/projects/openedx-proposals/en/latest/processes/oep-0010/decisions/0002-frontend-stable-branches.html

License
=======

The code in this repository is licensed under the AGPLv3 unless otherwise
noted.

Please see `LICENSE <LICENSE>`_ for details.

Contributing
============

Contributions are welcome.  Please open an issue or pull request on GitHub.
All changes, including bug fixes, should target ``main`` first; see `Branches
and Releases`_ for how they reach ``stable`` and the maintenance lines.

People
======

Contact @edx/edx-infinity if you are having any trouble developing in this repository.

Reporting Security Issues
=========================

Please do not report security issues in public. Email security@openedx.org instead.
