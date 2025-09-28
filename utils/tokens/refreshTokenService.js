const RefreshToken = require("../../models/RefreshToken");

const saveRefreshRecord = async (userId, jti, replacedBy = null) => {
  return await RefreshToken.create({ userId, jti, replacedBy });
}

const findRefreshRecord = async (jti) => {
  return await RefreshToken.findOne({ jti });
}

const markUsed = async (jti) => {
  return await RefreshToken.updateOne({ jti }, { used: true });
}

const revokeFamily = async (userId) => {
  return await RefreshToken.updateMany(
    { userId },
    { revoked: true }
  );
}

module.exports = {
  saveRefreshRecord,
  findRefreshRecord,
  markUsed,
  revokeFamily,
};
