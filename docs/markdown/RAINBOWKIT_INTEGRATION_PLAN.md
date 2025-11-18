# RainbowKit Entegrasyon Dokümantasyonu - Cobbee

## 📋 İçindekiler
1. [RainbowKit Nedir?](#rainbowkit-nedir)
2. [Kurulum Gereksinimleri](#kurulum-gereksinimleri)
3. [Temel Kurulum Adımları](#temel-kurulum-adımları)
4. [Özellikler ve Yetenekler](#özellikler-ve-yetenekler)
5. [Temalar ve Özelleştirme](#temalar-ve-özelleştirme)
6. [Blockchain Zincir Yapılandırması](#blockchain-zincir-yapılandırması)
7. [Authentication (SIWE)](#authentication-siwe)
8. [İleri Seviye Özelleştirmeler](#i̇leri-seviye-özelleştirmeler)
9. [Cobbee Projesi için Öneriler](#cobbee-projesi-için-öneriler)

---

## RainbowKit Nedir?

**Versiyon:** 2.2.9

RainbowKit, React uygulamaları için wallet bağlantı entegrasyonunu basitleştiren bir kütüphanedir. "Wallet bağlamanın en iyi yolu 🌈" olarak tanımlanır.

### Temel Özellikler:
- ✅ **Anlaşılır, Responsive ve Özelleştirilebilir** UI
- ✅ **40+ Wallet** desteği (MetaMask, Rainbow, Coinbase, WalletConnect, vb.)
- ✅ **Multi-Chain** desteği (Ethereum, Polygon, Optimism, Arbitrum, Base, vb.)
- ✅ **ENS** (Ethereum Name Service) desteği
- ✅ **Balance** görüntüleme
- ✅ **Dark/Light Mode** desteği
- ✅ **18 Dil** desteği (Türkçe dahil)
- ✅ **SIWE (Sign-In with Ethereum)** authentication
- ✅ **Transaction Tracking** - Son işlemleri gösterme

### Kullanılan Teknolojiler:
- **viem** - Ethereum etkileşimleri için
- **wagmi** - React hooks for Ethereum
- **@tanstack/react-query** - Veri yönetimi
- **EIP-1193** ve **EIP-6963** standartları

---

## Kurulum Gereksinimleri

### Gerekli Bağımlılıklar:

```json
{
  "dependencies": {
    "@rainbow-me/rainbowkit": "latest",
    "wagmi": "latest",
    "viem": "^2.x",
    "@tanstack/react-query": "latest",
    "react": "^19.x" // Cobbee'de zaten mevcut
  }
}
```

### WalletConnect Cloud Project ID
**ÖNEMLİ:** Ücretsiz bir `projectId` almanız gerekiyor:
- https://cloud.walletconnect.com/ adresinden kayıt olun
- Yeni bir proje oluşturun
- Project ID'yi kopyalayın

---

## Temel Kurulum Adımları

### 1. Paket Kurulumu

```bash
pnpm add @rainbow-me/rainbowkit wagmi viem@2.x @tanstack/react-query
```

### 2. Temel Yapılandırma Dosyası Oluşturma

**Önerilen Konum:** `/lib/rainbow-config.ts`

```typescript
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia, // Test için
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { http } from 'viem';

// Config oluşturma
export const rainbowConfig = getDefaultConfig({
  appName: 'Cobbee',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true, // Next.js için önemli!

  // Production için özel RPC endpoints (önerilir)
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_URL),
    [polygon.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_URL),
    // Diğer chainler...
  },
});

export const queryClient = new QueryClient();
```

### 3. Environment Variables

**`.env.local` dosyasına eklenecekler:**

```bash
# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Alchemy RPC URLs (Üretim için önerilir)
NEXT_PUBLIC_ALCHEMY_MAINNET_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_ALCHEMY_POLYGON_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_ALCHEMY_BASE_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY

# veya QuickNode
NEXT_PUBLIC_QUICKNODE_MAINNET_URL=https://...
```

### 4. Provider Wrapper Oluşturma

**Önerilen Konum:** `/components/providers/rainbow-provider.tsx`

```typescript
'use client'

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from "@tanstack/react-query";
import { rainbowConfig, queryClient } from '@/lib/rainbow-config';

export function RainbowProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={rainbowConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          locale="tr-TR" // Türkçe dil desteği
          showRecentTransactions={true}
          theme={darkTheme({
            accentColor: '#CCFF00', // Cobbee lime rengi
            accentColorForeground: 'black',
            borderRadius: 'large',
            fontStack: 'system',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 5. Root Layout'a Entegrasyon

**`app/layout.tsx` güncelleme:**

```typescript
import { RainbowProviders } from '@/components/providers/rainbow-provider'
import '@rainbow-me/rainbowkit/styles.css' // CSS import

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <RainbowProviders>
          {children}
        </RainbowProviders>
        <Analytics />
      </body>
    </html>
  )
}
```

### 6. ConnectButton Kullanımı

**Basit kullanım:**

```tsx
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <header>
      <ConnectButton />
    </header>
  );
}
```

**Özelleştirilmiş kullanım:**

```tsx
<ConnectButton
  label="Cüzdanı Bağla"
  accountStatus="address"
  chainStatus="icon"
  showBalance={false}
/>
```

---

## Özellikler ve Yetenekler

### 1. ConnectButton Props

| Prop | Tip | Varsayılan | Açıklama |
|------|-----|-----------|----------|
| `label` | string | "Cüzdan Bağla" | Buton yazısı |
| `accountStatus` | `"avatar"` \| `"address"` \| `"full"` | `"full"` | Hesap görünümü |
| `chainStatus` | `"icon"` \| `"name"` \| `"full"` \| `"none"` | `{smallScreen: "icon", largeScreen: "full"}` | Chain göstergesi |
| `showBalance` | boolean \| object | `{smallScreen: false, largeScreen: true}` | Balance gösterimi |

**Responsive Konfigürasyon:**
```tsx
<ConnectButton
  accountStatus={{
    smallScreen: "avatar",
    largeScreen: "full"
  }}
  showBalance={{
    smallScreen: false,
    largeScreen: true
  }}
/>
```

### 2. Modal Hooks - Programatik Kontrol

```tsx
import {
  useConnectModal,
  useAccountModal,
  useChainModal,
} from '@rainbow-me/rainbowkit';

export function MyComponent() {
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { openChainModal } = useChainModal();

  return (
    <>
      <button onClick={openConnectModal}>Cüzdan Bağla</button>
      <button onClick={openAccountModal}>Hesabım</button>
      <button onClick={openChainModal}>Ağ Değiştir</button>
    </>
  );
}
```

**Modal durumlarını kontrol etme:**
```tsx
const { connectModalOpen } = useConnectModal();
const { accountModalOpen } = useAccountModal();
const { chainModalOpen } = useChainModal();
```

### 3. Wagmi Hooks - Wallet Bilgilerine Erişim

```tsx
import { useAccount, useBalance, useDisconnect } from 'wagmi';

export function WalletInfo() {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();

  if (!isConnected) return <p>Cüzdan bağlı değil</p>;

  return (
    <div>
      <p>Adres: {address}</p>
      <p>Ağ: {chain?.name}</p>
      <p>Bakiye: {balance?.formatted} {balance?.symbol}</p>
      <button onClick={() => disconnect()}>Bağlantıyı Kes</button>
    </div>
  );
}
```

### 4. Transaction Tracking

```tsx
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';

export function SendCoffee() {
  const addRecentTransaction = useAddRecentTransaction();

  const handleSendCoffee = async () => {
    // Transaction gönderme işlemi...
    const hash = '0x...';

    addRecentTransaction({
      hash,
      description: 'Sarah'a 5 kahve gönderildi',
      confirmations: 1, // Kaç blok sonra onaylanmış sayılacak
    });
  };
}
```

**Provider'da aktifleştirme:**
```tsx
<RainbowKitProvider showRecentTransactions={true}>
```

---

## Temalar ve Özelleştirme

### Yerleşik Temalar

RainbowKit 3 hazır tema sunar:
1. `lightTheme()` - Açık tema (varsayılan)
2. `darkTheme()` - Koyu tema
3. `midnightTheme()` - Gece mavisi tema

### Cobbee Neo-Brutalist Tema Önerisi

```typescript
import { darkTheme } from '@rainbow-me/rainbowkit';

const cobbeeTheme = darkTheme({
  accentColor: '#CCFF00', // Cobbee lime
  accentColorForeground: '#000000', // Siyah yazı
  borderRadius: 'large', // Büyük border radius
  fontStack: 'system',
  overlayBlur: 'small',

  // Renk paletleri
  colors: {
    // Modal arka planı
    modalBackground: '#FFFFFF',
    modalBackdrop: 'rgba(0, 0, 0, 0.5)',

    // Butonlar
    accentColor: '#CCFF00',
    accentColorForeground: '#000000',

    // Uyarılar
    actionButtonBorder: '#000000',
    actionButtonBorderMobile: '#000000',

    // Bağlantı durumu
    connectButtonBackground: '#0000FF',
    connectButtonBackgroundError: '#FF6B35',
    connectButtonInnerBackground: '#FFFFFF',
    connectButtonText: '#000000',
    connectButtonTextError: '#FFFFFF',

    // Wallet kartları
    downloadBottomCardBackground: '#CCFF00',
    downloadTopCardBackground: '#0000FF',
  },
});

// Kullanımı:
<RainbowKitProvider theme={cobbeeTheme}>
```

### Otomatik Dark/Light Mode

```tsx
<RainbowKitProvider
  theme={{
    lightMode: lightTheme({
      accentColor: '#CCFF00',
      borderRadius: 'large',
    }),
    darkMode: darkTheme({
      accentColor: '#0000FF',
      borderRadius: 'large',
    }),
  }}
/>
```

### Modal Boyutu

```tsx
<RainbowKitProvider modalSize="compact"> // veya "wide"
```

---

## Blockchain Zincir Yapılandırması

### Desteklenen Ana Zincirler

```typescript
import {
  mainnet,      // Ethereum Mainnet
  polygon,      // Polygon
  optimism,     // Optimism
  arbitrum,     // Arbitrum One
  base,         // Base
  zora,         // Zora
  sepolia,      // Sepolia (Test)
  goerli,       // Goerli (Test - deprecated)
} from 'wagmi/chains';
```

### İlk Chain Ayarlama

```tsx
// Chain ID ile
<RainbowKitProvider initialChain={1}>

// Chain objesi ile
<RainbowKitProvider initialChain={mainnet}>
```

### Chain Icon ve Arka Plan Özelleştirme

```typescript
const config = getDefaultConfig({
  chains: [
    {
      ...mainnet,
      iconBackground: '#000',
      iconUrl: 'https://cobbee.fun/icons/ethereum.png',
    },
    {
      ...polygon,
      iconBackground: '#8247E5',
      iconUrl: 'https://cobbee.fun/icons/polygon.png',
    },
  ],
});
```

### Custom Chain Ekleme

**Örnek: Avalanche C-Chain**

```typescript
import { Chain } from 'wagmi/chains';

const avalanche: Chain = {
  id: 43114,
  name: 'Avalanche',
  iconUrl: 'https://...',
  iconBackground: '#E84142',
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche',
    symbol: 'AVAX',
  },
  rpcUrls: {
    default: {
      http: ['https://api.avax.network/ext/bc/C/rpc']
    },
  },
  blockExplorers: {
    default: {
      name: 'SnowTrace',
      url: 'https://snowtrace.io'
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 11_907_934,
    },
  },
};

// Kullanımı:
const config = getDefaultConfig({
  chains: [mainnet, avalanche],
  // ...
});
```

---

## Authentication (SIWE)

### Sign-In with Ethereum (SIWE) Nedir?

Kullanıcılar wallet'larıyla mesaj imzalayarak kimliklerini doğrular ve güvenli oturum açarlar.

### NextAuth ile SIWE Kurulumu

**1. Paket kurulumu:**
```bash
pnpm add @rainbow-me/rainbowkit-siwe-next-auth next-auth
```

**2. Provider sarmalama:**

```tsx
import { RainbowKitSiweNextAuthProvider } from '@rainbow-me/rainbowkit-siwe-next-auth';
import { SessionProvider } from 'next-auth/react';

export default function App({ Component, pageProps }) {
  return (
    <WagmiProvider config={config}>
      <SessionProvider session={pageProps.session}>
        <RainbowKitSiweNextAuthProvider>
          <RainbowKitProvider>
            <Component {...pageProps} />
          </RainbowKitProvider>
        </RainbowKitSiweNextAuthProvider>
      </SessionProvider>
    </WagmiProvider>
  );
}
```

**3. SIWE mesajını özelleştirme:**

```tsx
<RainbowKitSiweNextAuthProvider
  getSiweMessageOptions={() => ({
    statement: 'Cobbee\'ye hoş geldiniz! Giriş yapmak için bu mesajı imzalayın.',
    domain: 'cobbee.fun',
    uri: window.location.origin,
  })}
>
```

**4. Server-side session erişimi:**

```typescript
import { getToken } from 'next-auth/jwt';

export async function getServerSideProps(context) {
  const token = await getToken({ req: context.req });
  const address = token?.sub ?? null; // Kullanıcının wallet adresi

  if (!address) {
    return { redirect: { destination: '/login' } };
  }

  return { props: { address } };
}
```

---

## İleri Seviye Özelleştirmeler

### 1. Custom Connect Button

Tamamen özel bir bağlan butonu oluşturmak için:

```tsx
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected = ready && account && chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div {...(!ready && { 'aria-hidden': true })}>
            {(() => {
              // Bağlı değilse
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl px-8 py-4 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Cüzdanı Bağla
                  </button>
                );
              }

              // Yanlış ağda ise
              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="bg-[#FF6B35] text-white font-bold px-6 py-3 rounded-xl border-4 border-black"
                  >
                    Yanlış Ağ
                  </button>
                );
              }

              // Bağlı ve doğru ağda
              return (
                <div className="flex gap-3">
                  {/* Chain Button */}
                  <button
                    onClick={openChainModal}
                    className="bg-white border-4 border-black rounded-xl px-4 py-2 flex items-center gap-2"
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <img
                        src={chain.iconUrl}
                        alt={chain.name}
                        className="w-6 h-6"
                      />
                    )}
                    {chain.name}
                  </button>

                  {/* Account Button */}
                  <button
                    onClick={openAccountModal}
                    className="bg-[#0000FF] text-white font-bold border-4 border-black rounded-xl px-6 py-2"
                  >
                    {account.displayName}
                    {account.displayBalance && ` (${account.displayBalance})`}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
```

### 2. Custom Wallet List

Hangi wallet'ların gösterileceğini kontrol etme:

```typescript
import {
  connectorsForWallets,
  getDefaultWallets,
} from '@rainbow-me/rainbowkit';
import {
  rainbowWallet,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  trustWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Önerilen',
      wallets: [
        rainbowWallet,
        metaMaskWallet,
        coinbaseWallet,
      ],
    },
    {
      groupName: 'Diğer',
      wallets: [
        walletConnectWallet,
        trustWallet,
        ledgerWallet,
      ],
    },
  ],
  {
    appName: 'Cobbee',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  }
);

// createConfig ile kullan:
import { createConfig } from 'wagmi';

const config = createConfig({
  connectors,
  chains: [mainnet, polygon],
  // ...
});
```

### 3. Custom Avatar

```tsx
import { RainbowKitProvider, AvatarComponent } from '@rainbow-me/rainbowkit';

const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  // ENS image varsa onu göster
  if (ensImage) {
    return <img src={ensImage} width={size} height={size} />;
  }

  // Yoksa adresten oluşturulan bir avatar
  const color = generateColorFromAddress(address);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        border: '4px solid black',
      }}
    />
  );
};

// Provider'da kullan:
<RainbowKitProvider avatar={CustomAvatar}>
```

### 4. Lokalizasyon

**Desteklenen diller:** en-US, tr-TR, zh-CN, es-419, fr-FR, ar-AR, pt-BR, ru-RU, id-ID, ja-JP, ko-KR, th-TH, uk-UA, vi-VN, de-DE, hi-IN, zh-HK, zh-TW

```tsx
<RainbowKitProvider locale="tr-TR">
```

**Next.js ile dinamik dil:**
```tsx
import { useRouter } from 'next/router';

export function Providers({ children }) {
  const { locale } = useRouter();

  return (
    <RainbowKitProvider locale={locale as any}>
      {children}
    </RainbowKitProvider>
  );
}
```

---

## Cobbee Projesi için Öneriler

### 1. Mevcut Proje Durumu Analizi

**Cobbee Mevcut Yapısı:**
- ✅ Next.js 16 (App Router)
- ✅ React 19
- ✅ TypeScript
- ✅ Tailwind CSS v4
- ✅ pnpm package manager
- ❌ Henüz wallet entegrasyonu yok
- ❌ Blockchain transaction yok

### 2. Önerilen Entegrasyon Noktaları

#### A. Coffee Support Component
**Konum:** `/components/coffee-support.tsx`

**Mevcut Flow:**
1. Kullanıcı coffee sayısı seçer
2. İsim ve mesaj girer
3. "Buy Coffee" butonuna tıklar
4. Mock transaction hash gösterilir ✅

**RainbowKit ile Flow:**
1. **Wallet bağlantısı kontrolü** (bağlı değilse modal açılır)
2. Coffee sayısı ve miktar hesaplama
3. **Ağ kontrolü** (desteklenen bir ağda mı?)
4. **Gerçek blockchain transaction** gönderme
5. Transaction hash ile **basescan linki**
6. **Recent transactions** listesine ekleme

#### B. Dashboard Page
**Konum:** `/app/dashboard/page.tsx`

**Eklenebilecek Özellikler:**
- Wallet bağlantı durumu göstergesi
- Destekleyen kişilerin wallet adresleri
- On-chain transaction verification
- Gerçek blockchain balance gösterimi

#### C. User Profile
**Konum:** `/app/[username]/page.tsx`

**Eklenebilecek Özellikler:**
- Creator'ın wallet adresi gösterimi
- On-chain supporter sayısı
- Toplam ETH/MATIC vb. kazancı

### 3. Önerilen Klasör Yapısı

```
/lib/
  ├── rainbow/
  │   ├── config.ts           # RainbowKit config
  │   ├── chains.ts           # Custom chains
  │   ├── wallets.ts          # Wallet list customization
  │   └── theme.ts            # Cobbee theme

/components/
  ├── providers/
  │   └── rainbow-provider.tsx  # Provider wrapper
  ├── wallet/
  │   ├── connect-button.tsx    # Custom connect button
  │   ├── wallet-info.tsx       # Wallet bilgileri
  │   └── chain-switcher.tsx    # Chain değiştirme

/hooks/
  ├── useWallet.ts              # Wallet bilgilerine erişim
  ├── useCoffeTransaction.ts    # Coffee gönderme transaction'ı
  └── useCreatorBalance.ts      # Creator balance'ı

/app/
  └── layout.tsx                # RainbowProvider eklenmeli
```

### 4. Environment Variables Planı

```bash
# .env.example
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_ALCHEMY_MAINNET_URL=
NEXT_PUBLIC_ALCHEMY_POLYGON_URL=
NEXT_PUBLIC_ALCHEMY_BASE_URL=
```

### 5. Tema Uyumluluğu

**Cobbee Neo-Brutalist Tasarım:**
- Kalın borderlar (4px) ✅ `borderRadius: 'large'`
- Bold renkler (#CCFF00, #0000FF, #FF6B35) ✅ `accentColor`
- Chunky shadow'lar ✅ Custom CSS ile
- Bold tipografi ✅ `fontStack: 'system'`

**RainbowKit Tema Önerisi:**
```typescript
const cobbeeTheme = darkTheme({
  accentColor: '#CCFF00',
  accentColorForeground: '#000000',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
});
```

### 6. Desteklenecek Zincirler

**Öneri:**
1. **Ethereum Mainnet** - Ana ağ
2. **Polygon** - Düşük gas fee
3. **Base** - Coinbase'in L2'si, düşük fee
4. **Optimism** - L2, düşük fee
5. **Arbitrum** - L2, düşük fee

**Test için:**
- **Sepolia** - Ethereum testnet

### 7. Authentication Stratejisi

**Seçenek 1: SIWE (Sign-In with Ethereum)**
- ✅ Decentralized
- ✅ Güvenli
- ✅ NextAuth entegrasyonu kolay
- ❌ Backend gerektirir

**Seçenek 2: Sadece Wallet Bağlantısı**
- ✅ Basit
- ✅ Backend'siz çalışır
- ❌ Session yönetimi zor

**Öneri:** Başlangıçta Seçenek 2, ilerleyen zamanlarda SIWE ekleme

### 8. Transaction Fee Optimizasyonu

**Gas fee azaltma stratejileri:**
1. **L2 kullanımı** - Polygon, Base, Optimism
2. **Batch transactions** - Birden fazla coffee'yi toplu gönderme
3. **Gas price tracking** - Düşük gas zamanlarını önerme
4. **EIP-1559** - Daha öngörülebilir fee

### 9. Kullanıcı Deneyimi İyileştirmeleri

**Transaction sürecinde:**
1. **Wallet bağlantısı kontrolü**
2. **Ağ uyumluluğu kontrolü** - Yanlış ağdaysa switch öner
3. **Balance kontrolü** - Yeterli bakiye var mı?
4. **Gas fee tahmini** - Transaction maliyeti göster
5. **Transaction gönderme**
6. **Bekleme durumu** - Pending animation
7. **Onay** - Success ekranı
8. **Transaction tracking** - Basescan linki

### 10. Güvenlik Önerileri

**Frontend güvenliği:**
- ✅ Transaction amount'ları validate et
- ✅ Maximum coffee limit (örn: 1000 coffee max)
- ✅ Input sanitization ve XSS koruması

**Backend güvenliği (gelecekte):**
- ✅ Transaction verification
- ✅ Duplicate transaction önleme
- ✅ Rate limiting
- ✅ SIWE message validation

### 11. Performans İyileştirmeleri

**Bundle size:**
- RainbowKit CSS'i optimize et
- Tree-shaking yap
- Kullanılmayan wallet'ları çıkar

**Loading stratejileri:**
- Dynamic import ile lazy load
- SSR için hydration optimize et
- React Query cache stratejileri

### 12. Test Stratejisi

**Unit testler:**
- Wallet bağlantı hooks
- Transaction logic
- Amount calculation

**Integration testler:**
- E2E transaction flow
- Modal açılma/kapanma
- Chain switching

**Manual test checklist:**
- [ ] MetaMask bağlantısı
- [ ] WalletConnect bağlantısı
- [ ] Chain switching
- [ ] Balance gösterimi
- [ ] Transaction gönderme
- [ ] Transaction tracking
- [ ] Disconnect flow

---

## Sonraki Adımlar

### Aşama 1: Temel Kurulum (1-2 gün)
1. ✅ RainbowKit paketlerini yükle
2. ✅ WalletConnect Project ID al
3. ✅ Config dosyalarını oluştur
4. ✅ Provider'ları app/layout.tsx'e ekle
5. ✅ Temel ConnectButton test et

### Aşama 2: Tema Özelleştirme (1 gün)
1. ✅ Cobbee tema renklerini uygula
2. ✅ Custom connect button tasarla
3. ✅ Modal boyut ve stil ayarları

### Aşama 3: Coffee Support Entegrasyonu (2-3 gün)
1. ✅ Wallet bağlantı kontrolü ekle
2. ✅ Chain validasyonu
3. ✅ Transaction gönderme logic
4. ✅ Success/error handling
5. ✅ Transaction tracking

### Aşama 4: Dashboard Entegrasyonu (1-2 gün)
1. ✅ Wallet bilgileri göster
2. ✅ On-chain data fetch
3. ✅ Recent transactions

---

## Kaynaklar ve Linkler

### Resmi Dokümantasyon:
- **RainbowKit Docs:** https://rainbowkit.com/tr/docs/introduction
- **Wagmi Docs:** https://wagmi.sh/
- **Viem Docs:** https://viem.sh/
- **WalletConnect Cloud:** https://cloud.walletconnect.com/

### Örnek Projeler:
- **RainbowKit Examples:** https://github.com/rainbow-me/rainbowkit/tree/main/examples
- **CodeSandbox Demos:** Dokümantasyon sayfalarında mevcut

### Community:
- **GitHub Issues:** https://github.com/rainbow-me/rainbowkit/issues
- **Twitter:** @rainbowdotme
- **Discord:** RainbowKit community

---

## Notlar

Bu dokümantasyon RainbowKit 2.2.9 versiyonuna göre hazırlanmıştır. Kurulum yapmadan önce:

1. En güncel versiyonu kontrol edin
2. Breaking changes için changelog'u okuyun
3. Cobbee'nin mevcut Next.js 16 + React 19 stack'i ile uyumluluğu doğrulayın
4. Test ortamında önce deneyin (Sepolia testnet)

**UYARI:** Bu dokümanda sadece RainbowKit entegrasyonu için teknik bilgiler verilmiştir. User flow ve hangi sayfalara entegre edileceği gibi konular ayrıca planlanmalıdır.
