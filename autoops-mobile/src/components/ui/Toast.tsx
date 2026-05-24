import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type Variant = 'info' | 'success' | 'error';

type Toast = { id: number; message: string; variant: Variant };

type ToastContextType = {
  show: (message: string, variant?: Variant) => void;
};

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, variant: Variant = 'info') => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View pointerEvents="none" style={styles.container}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }, 2400);
    return () => clearTimeout(t);
  }, [opacity]);

  const bg =
    toast.variant === 'success' ? '#16A34A' : toast.variant === 'error' ? '#DC2626' : '#1F2937';

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, opacity }]}>
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    maxWidth: 380,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
