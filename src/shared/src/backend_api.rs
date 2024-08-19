//! Selected backend canister API signatures.
#![allow(clippy::missing_errors_doc)] // The code is auto-generated.  Maybe `didc bind` will preserve comments in future.
use crate::types::{Guards, Stats};
use candid::{self, Principal};
use ic_cdk::api::call::CallResult as Result;

/// Client for the backend canister, implementing a subset of the API.
///
/// Note: The canister signatures are generated by: `didc bind --type rs src/backend/backend.did`
///       It _may_ make sense to generate the entire API and types in this way.  That would guarantee
///       that the types are in sync with the candid file.  However at the time of writing there is
///       not a nice way of adding derivations to types generated in this way. It would make sense
///       to wait for a nice solution to that first.  If automatic derivation is absolutely
///       required, there are hacky bash scripts to add derivations to the generated rust in the
///       nns-dapp repository.
pub struct Service(pub Principal);
impl Service {
    pub async fn bulk_up(&self, arg0: Vec<u8>) -> Result<()> {
        ic_cdk::call(self.0, "bulk_up", (arg0,)).await
    }
    pub async fn set_guards(&self, arg0: Guards) -> Result<()> {
        ic_cdk::call(self.0, "set_guards", (arg0,)).await
    }
    pub async fn stats(&self) -> Result<(Stats,)> {
        ic_cdk::call(self.0, "stats", ()).await
    }
}