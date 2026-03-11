import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertButton,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from './theme';

type PendingAlert = {
  title?: string;
  message?: string;
  buttons?: AlertButton[];
};

type ShowAlert = (payload: PendingAlert) => void;

let showStyledAlert: ShowAlert | null = null;
let originalAlertImpl: typeof Alert.alert | null = null;
let isInstalled = false;

const normalizeButtons = (buttons?: AlertButton[]): AlertButton[] => {
  if (!buttons || buttons.length === 0) {
    return [{ text: 'OK' }];
  }
  return buttons;
};

export const showAppAlert = (
  title?: string,
  message?: string,
  buttons?: AlertButton[],
) => {
  const resolvedTitle = title || '';
  const normalizedButtons = buttons ? normalizeButtons(buttons) : undefined;

  if (showStyledAlert) {
    showStyledAlert({
      title: resolvedTitle,
      message,
      buttons: normalizedButtons,
    });
    return;
  }

  if (originalAlertImpl) {
    if (normalizedButtons) {
      originalAlertImpl(resolvedTitle, message, normalizedButtons);
    } else {
      originalAlertImpl(resolvedTitle, message);
    }
    return;
  }

  if (normalizedButtons) {
    Alert.alert(resolvedTitle, message, normalizedButtons);
  } else {
    Alert.alert(resolvedTitle, message);
  }
};

export const installStyledAlert = () => {
  if (isInstalled) {
    return;
  }

  originalAlertImpl = Alert.alert.bind(Alert);

  (Alert as any).alert = (
    title?: string,
    message?: string,
    buttons?: AlertButton[],
  ) => {
    const resolvedTitle = title || '';
    const normalizedButtons = buttons ? normalizeButtons(buttons) : undefined;
    if (showStyledAlert) {
      showStyledAlert({
        title: resolvedTitle,
        message,
        buttons: normalizedButtons,
      });
      return;
    }

    if (!originalAlertImpl) {
      return;
    }

    if (normalizedButtons) {
      originalAlertImpl(resolvedTitle, message, normalizedButtons);
    } else {
      originalAlertImpl(resolvedTitle, message);
    }
  };

  isInstalled = true;
};

export const uninstallStyledAlert = () => {
  if (!isInstalled || !originalAlertImpl) {
    return;
  }

  (Alert as any).alert = originalAlertImpl;
  isInstalled = false;
};

export function StyledAlertHost() {
  const theme = useTheme();
  const [pendingAlert, setPendingAlert] = useState<PendingAlert | null>(null);

  useEffect(() => {
    showStyledAlert = (payload) => {
      setPendingAlert(payload);
    };

    return () => {
      showStyledAlert = null;
    };
  }, []);

  const buttons = useMemo(
    () => normalizeButtons(pendingAlert?.buttons),
    [pendingAlert?.buttons],
  );

  const close = () => setPendingAlert(null);

  if (!pendingAlert) {
    return null;
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          {!!pendingAlert.title && (
            <Text style={[styles.title, { color: theme.text }]}>
              {pendingAlert.title}
            </Text>
          )}

          {!!pendingAlert.message && (
            <Text style={[styles.message, { color: theme.textSecondary }]}>
              {pendingAlert.message}
            </Text>
          )}

          <View style={styles.buttonsRow}>
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';

              let buttonColor = theme.primary;
              if (isDestructive) buttonColor = '#dc2626';
              if (isCancel) buttonColor = theme.textSecondary;

              return (
                <Pressable
                  key={`${button.text || 'button'}-${index}`}
                  style={({ pressed }) => [
                    styles.button,
                    {
                      borderColor: theme.border,
                      backgroundColor: pressed ? theme.surface : theme.card,
                    },
                  ]}
                  onPress={() => {
                    close();
                    button.onPress?.();
                  }}
                >
                  <Text style={[styles.buttonText, { color: buttonColor }]}>
                    {button.text || 'OK'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
  button: {
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
