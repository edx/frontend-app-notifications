import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { camelCaseObject, useIntl } from '@openedx/frontend-base';
import messages from '../messages';
import tourCheckpoints from '../constants';
import { getNotificationsTours, updateNotificationsTour } from './api';
import { Tour } from '../../context/notificationsContext';
import { QK } from '../../data/hook';

export function camelToConstant(string: string): string {
  return string.replace(/[A-Z]/g, (match) => `_${match}`).toUpperCase();
}

function normaliseTourData(data: unknown): Tour[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .filter((tour): tour is Tour => Boolean(tour) && typeof tour === 'object')
    .map(tour => ({ ...tour, enabled: true }));
}

export function useTours() {
  return useQuery({
    queryKey: QK.tours(),
    queryFn: async (): Promise<Tour[]> => {
      const data = await getNotificationsTours();
      return camelCaseObject(normaliseTourData(data));
    },
  });
}

export function useUpdateTourShowStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tourId: number) => updateNotificationsTour(tourId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.tours() });
    },
  });
}

export function useTourConfiguration() {
  const intl = useIntl();
  const { data: tours } = useTours();
  const { mutate: updateTour } = useUpdateTourShowStatus();

  return useMemo(
    () => {
      const checkpointsByKey = tourCheckpoints(intl);
      // The tours endpoint is shared with other MFEs (e.g. discussions), so it can
      // return tours this app has no checkpoints for. Drop those rather than passing
      // them to ProductTour, which requires every entry to be a tour object.
      return (tours ?? [])
        .filter((tour) => typeof tour?.tourName === 'string')
        .map((tour) => ({ tour, key: camelToConstant(tour.tourName) }))
        .filter(({ key }) => Object.prototype.hasOwnProperty.call(checkpointsByKey, key))
        .map(({ tour, key }) => ({
          tourId: tour.tourName,
          dismissAltText: intl.formatMessage(messages.dismissButtonText),
          endButtonText: intl.formatMessage(messages.endButtonText),
          enabled: Boolean(tour.enabled && tour.showTour),
          onDismiss: () => updateTour(tour.id),
          onEnd: () => updateTour(tour.id),
          checkpoints: checkpointsByKey[key],
        }));
    },
    [intl, tours, updateTour],
  );
}
