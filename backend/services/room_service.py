from typing import Dict, Set
import secrets

class RoomService:
    def __init__(self):
        # room_id -> {user_id: {sid, name, stream_active, screen_share_active, language}}
        self.rooms: Dict[str, Dict[str, Dict]] = {}

    def create_room(self, room_id: str = None) -> str:
        """Create a new room and return room_id"""
        if not room_id:
            room_id = secrets.token_urlsafe(8)

        if room_id not in self.rooms:
            self.rooms[room_id] = {}

        return room_id

    def join_room(self, room_id: str, user_id: str, sid: str, name: str, language: str = 'Spanish') -> bool:
        """Add user to room"""
        # Validate room_id
        if not room_id or room_id.strip() == '':
            return False

        if room_id not in self.rooms:
            self.create_room(room_id)

        # Limit to 4 users
        if len(self.rooms[room_id]) >= 4 and user_id not in self.rooms[room_id]:
            return False

        self.rooms[room_id][user_id] = {
            'sid': sid,
            'name': name,
            'stream_active': False,
            'screen_share_active': False,
            'language': language
        }
        return True

    def leave_room(self, room_id: str, user_id: str):
        """Remove user from room"""
        if room_id in self.rooms and user_id in self.rooms[room_id]:
            del self.rooms[room_id][user_id]

            # Clean up empty rooms
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    def get_room_users(self, room_id: str) -> Dict:
        """Get all users in a room"""
        return self.rooms.get(room_id, {})

    def update_user_language(self, room_id: str, user_id: str, language: str):
        """Update user's preferred language"""
        if room_id in self.rooms and user_id in self.rooms[room_id]:
            self.rooms[room_id][user_id]['language'] = language

    def set_stream_status(self, room_id: str, user_id: str, active: bool):
        """Update user's stream status"""
        if room_id in self.rooms and user_id in self.rooms[room_id]:
            self.rooms[room_id][user_id]['stream_active'] = active

    def set_screen_share_status(self, room_id: str, user_id: str, active: bool):
        """Update user's screen share status"""
        if room_id in self.rooms and user_id in self.rooms[room_id]:
            self.rooms[room_id][user_id]['screen_share_active'] = active

    def get_user_by_sid(self, sid: str) -> tuple:
        """Find user by socket id - returns (room_id, user_id)"""
        for room_id, users in self.rooms.items():
            for user_id, user_data in users.items():
                if user_data['sid'] == sid:
                    return (room_id, user_id)
        return (None, None)

room_service = RoomService()
