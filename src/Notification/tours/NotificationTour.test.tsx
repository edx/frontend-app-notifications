import React, { ReactNode } from 'react';
import {
  fireEvent, renderHook, screen, waitFor,
} from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { getAuthenticatedHttpClient, initializeMockApp, IntlProvider } from '@openedx/frontend-base';
import { QueryClientProvider } from '@tanstack/react-query';

import render, { createTestQueryClient } from '../../setupTest';
import NotificationTour from './NotificationTour';
import { getDiscussionTourUrl } from './data/api';
import { camelToConstant, useTourConfiguration } from './data/hooks';

const toursApiUrl = getDiscussionTourUrl();

let axiosMock: MockAdapter;

const renderTour = () => render(
  <>
    <div id="example-tour-target" />
    <NotificationTour />
  </>,
);

const waitForToursRequest = () => waitFor(() => expect(axiosMock.history.get).toHaveLength(1));

// A render error unmounts the whole tree, so check the sibling target survived as well.
const expectNoTour = (container: HTMLElement) => {
  expect(container.querySelector('#example-tour-target')).toBeInTheDocument();
  expect(container.querySelector('.pgn__checkpoint')).not.toBeInTheDocument();
};

describe('NotificationTour', () => {
  beforeEach(() => {
    initializeMockApp({
      authenticatedUser: {
        userId: 3,
        username: 'abc123',
        email: 'abc@example.com',
        name: 'Abc User',
        avatar: '',
        administrator: false,
        roles: [],
      },
    });
    axiosMock = new MockAdapter(getAuthenticatedHttpClient());
  });

  afterEach(() => {
    axiosMock.reset();
    jest.restoreAllMocks();
  });

  it('ignores tours that have no checkpoints in this app', async () => {
    axiosMock.onGet(toursApiUrl).reply(200, [
      { id: 1, tour_name: 'not_responded_filter', show_tour: true },
      { id: 2, tour_name: 'response_sort', show_tour: true },
    ]);

    const { container } = renderTour();
    await waitForToursRequest();

    expectNoTour(container);
  });

  it('shows a supported tour when unsupported tours are also returned', async () => {
    axiosMock.onGet(toursApiUrl).reply(200, [
      { id: 1, tour_name: 'not_responded_filter', show_tour: true },
      { id: 2, tour_name: 'example_tour', show_tour: true },
    ]);

    renderTour();

    expect(await screen.findByText('Example Tour')).toBeInTheDocument();
    expect(screen.getByText('This is an example tour')).toBeInTheDocument();
  });

  it('does not show a tour the user has already seen', async () => {
    axiosMock.onGet(toursApiUrl).reply(200, [
      { id: 2, tour_name: 'example_tour', show_tour: false },
    ]);

    renderTour();
    await waitForToursRequest();

    expect(screen.queryByText('Example Tour')).not.toBeInTheDocument();
  });

  it.each([
    ['null entries', [null, { id: 2, tour_name: 'example_tour', show_tour: true }]],
    ['entries without a tour name', [{ id: 1, show_tour: true }, { id: 2, tour_name: 'example_tour', show_tour: true }]],
    ['non-string tour names', [{ id: 1, tour_name: 42, show_tour: true }, { id: 2, tour_name: 'example_tour', show_tour: true }]],
    ['object prototype names', [{ id: 1, tour_name: 'constructor', show_tour: true }, { id: 2, tour_name: 'example_tour', show_tour: true }]],
  ])('skips %s', async (_, tours) => {
    axiosMock.onGet(toursApiUrl).reply(200, tours);

    renderTour();

    expect(await screen.findByText('Example Tour')).toBeInTheDocument();
  });

  it.each([
    ['an object', { detail: 'unexpected' }],
    ['a string', '<html></html>'],
    ['null', null],
  ])('renders nothing when the API returns %s', async (_, body) => {
    axiosMock.onGet(toursApiUrl).reply(200, body);

    const { container } = renderTour();
    await waitForToursRequest();

    expectNoTour(container);
  });

  it.each([403, 409, 500])('renders nothing when the API fails with %s', async (status) => {
    axiosMock.onGet(toursApiUrl).reply(status);

    const { container } = renderTour();
    await waitForToursRequest();

    expectNoTour(container);
  });

  it('marks the tour as seen when it is dismissed', async () => {
    axiosMock.onGet(toursApiUrl).reply(200, [{ id: 2, tour_name: 'example_tour', show_tour: true }]);
    axiosMock.onPut(`${toursApiUrl}2`).reply(200, { id: 2, tour_name: 'example_tour', show_tour: false });

    renderTour();
    fireEvent.click(await screen.findByTestId('dismiss-tour'));

    await waitFor(() => expect(axiosMock.history.put).toHaveLength(1));
    expect(JSON.parse(axiosMock.history.put[0].data)).toEqual({ show_tour: false });
  });

  it('marks the tour as seen when it is ended', async () => {
    axiosMock.onGet(toursApiUrl).reply(200, [{ id: 2, tour_name: 'example_tour', show_tour: true }]);
    axiosMock.onPut(`${toursApiUrl}2`).reply(200, { id: 2, tour_name: 'example_tour', show_tour: false });

    renderTour();
    fireEvent.click(await screen.findByText('Okay'));

    await waitFor(() => expect(axiosMock.history.put).toHaveLength(1));
    expect(axiosMock.history.put[0].url).toBe(`${toursApiUrl}2`);
  });

  it('passes ProductTour only tour objects, using dismissAltText', async () => {
    axiosMock.onGet(toursApiUrl).reply(200, [
      { id: 1, tour_name: 'not_responded_filter', show_tour: true },
      { id: 2, tour_name: 'example_tour', show_tour: true },
    ]);
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale="en">{children}</IntlProvider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useTourConfiguration(), { wrapper });

    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0]).toMatchObject({
      tourId: 'example_tour',
      dismissAltText: 'Dismiss',
      endButtonText: 'Okay',
      enabled: true,
    });
    expect(result.current[0]).not.toHaveProperty('dismissButtonText');
  });
});

describe('camelToConstant', () => {
  it.each([
    ['exampleTour', 'EXAMPLE_TOUR'],
    ['example_tour', 'EXAMPLE_TOUR'],
    ['notRespondedFilter', 'NOT_RESPONDED_FILTER'],
  ])('converts %s to %s', (input, expected) => {
    expect(camelToConstant(input)).toBe(expected);
  });
});
