
const router = require("express").Router();
const ctrl = require("../controllers");

router.get("/songs", ctrl.getSongs);
router.post("/songs/save", ctrl.saveSong);
router.post("/songs/:id/like", ctrl.likeSong);
router.get("/playlists", ctrl.getPlaylists);
router.post("/playlists/:id/add", ctrl.addToPlaylist);
router.get("/search", ctrl.searchDeezer);

module.exports = router;
