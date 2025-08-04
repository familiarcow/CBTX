# FromBase.xyz - Base Mini App Integration

## Overview

FromBase.xyz has been successfully integrated as a **Base Mini App** with built-in wallet functionality, allowing users to seamlessly swap assets directly within the Base App ecosystem without external wallet connections.

## 🚀 **New Features**

### Base Mini App Support
- **Native Wallet Integration**: Uses Base App's built-in wallet (no external connections needed)
- **Mini App Manifest**: Proper configuration for Base App integration
- **Seamless UX**: Works directly within Base App with native wallet access
- **Auto-Detection**: Automatically detects and connects to available wallet provider

### 🔗 **How It Works**

#### For Base App Users
1. **Access via `/base` route**: The mini app is available at `yourapp.com/base`
2. **Automatic Wallet**: Uses Base App's built-in wallet functionality
3. **One-Click Connect**: Single button to connect the native wallet
4. **Same Features**: All swap functionality available with built-in wallet

#### For Regular Web Users
- **Regular Routes**: Home (`/`) and Info (`/info`) still work with external wallets
- **Coinbase Wallet**: Original Coinbase Wallet SDK integration preserved
- **No Conflicts**: Two separate wallet systems don't interfere with each other

## 🛠 **Technical Architecture**

### MiniKit Provider System
```typescript
// Base Mini App route uses MiniKit
if (isBaseMiniApp) {
  return (
    <MiniKitProvider>
      <Router />
      <Toaster />
    </MiniKitProvider>
  );
}

// Regular routes use existing wallet system
return (
  <QueryClientProvider client={queryClient}>
    <Web3Provider>
      <Router />
      <Toaster />
    </Web3Provider>
  </QueryClientProvider>
);
```

### Compatibility Layer
- **`useMiniKit()`**: Core hook for MiniKit wallet access
- **`useWeb3()` Bridge**: Makes existing components work with MiniKit
- **`useWallet()` Bridge**: Provides consistent interface across providers

## 📁 **Key Files**

### Core Implementation
- `client/src/lib/minikit-provider.tsx` - MiniKit wallet provider
- `client/src/pages/base-miniapp.tsx` - Base Mini App specific page
- `client/src/App.tsx` - Route-based provider switching
- `client/public/.well-known/farcaster.json` - Base Mini App manifest

### Routes
- `/` - Home page (regular wallet)
- `/info` - Info page (regular wallet)  
- `/base` - **Base Mini App** (native wallet)

## 📱 **Usage as Base Mini App**

### 1. Deployment
Deploy your app with the `/base` route accessible:
```bash
npm run build
# Deploy to your hosting platform
# Ensure /.well-known/farcaster.json is accessible
```

### 2. Base App Integration
When shared or accessed through Base App:
- App displays with manifest information
- Users can launch directly into the mini app
- Native wallet connection available immediately

### 3. User Flow
1. User accesses app via Base App
2. Lands on `/base` route automatically  
3. Sees "Connect Base Wallet" button
4. One-click connection to built-in wallet
5. Same swap functionality with native wallet

## 🔧 **Development**

### Local Testing
```bash
# Start development server
npm run dev

# Test Base Mini App route
# Navigate to http://localhost:5001/base
```

### Browser Testing
- **Regular Routes**: Test external wallet connections on `/` and `/info`
- **Base Route**: Test built-in wallet simulation on `/base`
- **Compatibility**: Ensure both systems work independently

### Base App Testing
- Use Base App development tools
- Validate manifest at `/.well-known/farcaster.json`
- Test within Base App environment

## 📋 **Manifest Configuration**

Located at `client/public/.well-known/farcaster.json`:

```json
{
  "frame": {
    "name": "FromBase.xyz",
    "homeUrl": "https://frombase.xyz/base",
    "primaryCategory": "finance",
    "tags": ["defi", "swap", "cross-chain"]
  }
}
```

**Important**: Update the URLs in the manifest to match your production domain.

## ⚙️ **Transaction Flow**

### Native Wallet Transactions
1. **Connect**: One-click connection to Base App wallet
2. **Balance Check**: Automatic balance fetching for ETH, USDC, cbBTC
3. **Quote**: Get swap quotes using THORChain API
4. **Approve**: ERC-20 approvals through native wallet
5. **Swap**: Send transactions via Base App's built-in wallet
6. **Track**: Monitor swap progress on THORChain

### Compatibility
- **Same Backend**: Uses identical THORChain integration
- **Same Assets**: Supports ETH, USDC, cbBTC from Base
- **Same Destinations**: Swap to Bitcoin and other chains
- **Same UI**: Consistent user experience

## 🚦 **Benefits**

### For Users
- **No External Wallet**: Use Base App's built-in wallet
- **Seamless Experience**: No connection friction
- **Trusted Environment**: Wallet managed by Base App
- **Mobile Optimized**: Perfect for mobile Base App usage

### For Developers  
- **Code Reuse**: Existing components work with MiniKit
- **Dual Support**: Base Mini App + regular web app
- **Simple Integration**: Minimal code changes required
- **Future Proof**: Built with Base's official standards

## 📈 **Next Steps**

1. **Deploy**: Deploy with `/base` route to production
2. **Register**: Submit to Base App mini app directory  
3. **Test**: Validate in Base App environment
4. **Monitor**: Track usage analytics
5. **Optimize**: Improve based on user feedback

## 🔍 **Debugging**

### Common Issues
- **Wallet Not Available**: Check if `window.ethereum` exists
- **Connection Failed**: Verify Base App environment
- **Route Not Found**: Ensure `/base` route is properly deployed
- **Manifest Errors**: Validate JSON syntax in manifest file

### Console Logs
```javascript
// Check if in Base App
console.log('Has ethereum:', !!window.ethereum)
console.log('Current path:', window.location.pathname)
console.log('Is Base route:', window.location.pathname === '/base')
```

## 📚 **Resources**

- [Base Mini Apps Documentation](https://docs.base.org/base-app/introduction/getting-started)
- [OnchainKit Documentation](https://onchainkit.xyz)
- [THORChain Docs](https://docs.thorchain.org)
- [Base Chain Explorer](https://basescan.org)

---

**🎯 Your FromBase.xyz app is now ready to work as both a regular web application AND a Base Mini App with native wallet integration!** 