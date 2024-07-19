use minreq;
use rawtx_rs::bitcoin;
use serde::Deserialize;
use std::{error, fmt};

pub struct RestClient {
    host: String,
    port: u16,
}

#[derive(Deserialize)]
pub struct ChainInfo {
    pub initialblockdownload: bool,
    pub verificationprogress: f32,
    pub blocks: u64,
}

#[derive(Debug)]
pub enum RestError {
    MinReq(minreq::Error),
    BitcoinDecode(bitcoin::consensus::encode::Error),
    HTTP(i32, String),
}

impl fmt::Display for RestError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            RestError::MinReq(e) => write!(f, "MinReq HTTP GET request error: {:?}", e),
            RestError::BitcoinDecode(e) => write!(f, "Bitcoin decode error: {:?}", e),
            RestError::HTTP(code, msg) => write!(f, "HTTP error: {} {}", code, msg),
        }
    }
}

impl error::Error for RestError {
    fn source(&self) -> Option<&(dyn error::Error + 'static)> {
        match *self {
            RestError::MinReq(ref e) => Some(e),
            RestError::BitcoinDecode(ref e) => Some(e),
            RestError::HTTP(_, _) => None,
        }
    }
}

impl From<minreq::Error> for RestError {
    fn from(e: minreq::Error) -> Self {
        RestError::MinReq(e)
    }
}

impl From<bitcoin::consensus::encode::Error> for RestError {
    fn from(e: bitcoin::consensus::encode::Error) -> Self {
        RestError::BitcoinDecode(e)
    }
}

impl RestClient {
    pub fn new(host: &str, port: u16) -> RestClient {
        RestClient {
            host: host.to_string(),
            port,
        }
    }

    pub fn chain_info(&self) -> Result<ChainInfo, RestError> {
        let url = format!("http://{}:{}/rest/chaininfo.json", self.host, self.port);
        let response = minreq::get(url).send()?;
        if !(response.status_code == 200 && response.reason_phrase == "OK") {
            return Err(RestError::HTTP(
                response.status_code,
                response.reason_phrase,
            ));
        }

        Ok(response.json::<ChainInfo>()?)
    }

    pub fn block_at_height(&self, height: u64) -> Result<bitcoin::Block, RestError> {
        let url = format!(
            "http://{}:{}/rest/blockhashbyheight/{}.hex",
            self.host, self.port, height
        );
        let response_hash = minreq::get(url).send()?;
        if !(response_hash.status_code == 200 && response_hash.reason_phrase == "OK") {
            return Err(RestError::HTTP(
                response_hash.status_code,
                response_hash.reason_phrase,
            ));
        }

        let hash = response_hash.as_str()?.trim();

        let url = format!("http://{}:{}/rest/block/{}.bin", self.host, self.port, hash);
        let response_block = minreq::get(url).send()?;
        if !(response_block.status_code == 200 && response_block.reason_phrase == "OK") {
            return Err(RestError::HTTP(
                response_block.status_code,
                response_block.reason_phrase,
            ));
        }

        Ok(bitcoin::consensus::deserialize(response_block.as_bytes())?)
    }
}
