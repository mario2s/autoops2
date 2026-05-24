import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type Cta = { label: string; onPress: () => void } | null;

const Ctx = createContext<{ cta: Cta; setCta: (c: Cta) => void }>({
  cta: null,
  setCta: () => {},
});

export function CatalogCtaProvider({ children }: { children: React.ReactNode }) {
  const [cta, setCta] = useState<Cta>(null);
  return <Ctx.Provider value={{ cta, setCta }}>{children}</Ctx.Provider>;
}

export function useCatalogCta() {
  return useContext(Ctx);
}

export function useCatalogCtaRegister(label: string, onPress: () => void) {
  const { setCta } = useContext(Ctx);
  const pressRef = useRef(onPress);
  pressRef.current = onPress;
  const stable = useCallback(() => pressRef.current(), []);
  useEffect(() => {
    setCta({ label, onPress: stable });
    return () => setCta(null);
  }, [label, stable, setCta]);
}
