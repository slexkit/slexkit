export const SLEXKIT_VERSION = "0.3.0";
export const SLEX_PROTOCOL_VERSION = "0.1";
export const SLEXKIT_COMPONENTS_VERSION = SLEXKIT_VERSION;

export function getSlexKitInfo() {
  return {
    version: SLEXKIT_VERSION,
    protocolVersion: SLEX_PROTOCOL_VERSION,
    componentsVersion: SLEXKIT_COMPONENTS_VERSION,
  };
}
