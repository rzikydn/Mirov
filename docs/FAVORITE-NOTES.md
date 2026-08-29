# Favorite Notes Feature

## Overview

Fitur Favorite Notes memungkinkan ADMIN dan SUPERUSER untuk menandai catatan penting dengan sistem bintang (star). Fitur ini dilengkapi dengan animasi smooth, optimistic UI, dan history tracking otomatis.

## Permissions

| Role | Can Favorite/Unfavorite |
|------|:-----------------------:|
| SUPERUSER | ✅ |
| ADMIN | ✅ |
| UMUM | ❌ |

## Features

### 1. Toggle Favorite
- **Icon**: Tombol bintang di pojok kanan atas note card
- **Color**:
  - Favorit: Bintang kuning penuh (fill-yellow-400)
  - Tidak favorit: Bintang putih kosong
- **Visibility**:
  - Selalu terlihat jika note sudah difavoritkan
  - Muncul saat hover untuk note yang belum difavoritkan

### 2. Optimistic UI
- State lokal diupdate terlebih dahulu sebelum API call
- Animasi langsung muncul tanpa loading
- Auto-rollback jika request gagal

### 3. Smooth Animations
```css
/* Button Animation */
transition-all duration-300
hover:scale-110

/* Star Icon Animation */
scale-100 → scale-110 (saat favorit)
fill-white → fill-yellow-400 (color transition)
```

### 4. History Tracking

Setiap toggle favorit otomatis tercatat di history:

#### Favorit (Add to Favorites)
- **Action**: EDIT
- **Badge**: "Favorit" (kuning)
- **Icon**: ⭐ Bintang kuning penuh
- **Border**: Yellow (border-yellow-400)
- **Description**: `{userName} added note to favorites`

#### Unfavorit (Remove from Favorites)
- **Action**: EDIT
- **Badge**: "Unfavorit" (merah)
- **Icon**: ⭐ Bintang merah penuh
- **Border**: Red (border-red-400)
- **Description**: `{userName} removed note from favorites`

## Database Schema

```prisma
model Note {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  color     String?
  userId    Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  favorite  Boolean  @default(false)  // 👈 New field
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notes")
}
```

## API Usage

### Update Note (including favorite)

**Request:**
```http
PUT /api/notes/:id
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "content": "Note content",
  "color": "#FFD89B",
  "favorite": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Note updated successfully",
  "data": {
    "id": 1,
    "title": "Note Title",
    "content": "Note content",
    "color": "#FFD89B",
    "favorite": true,
    "userId": 1,
    "createdAt": "2025-01-04T10:00:00Z",
    "updatedAt": "2025-01-04T10:05:00Z"
  }
}
```

## Implementation Details

### Frontend (React)

**File**: `src/components/dashboards/TeamNotes.tsx`

```typescript
const toggleFavorite = async (note: ColoredNote) => {
  const newFavoriteStatus = !note.favorite;

  // 1. Update state lokal terlebih dahulu (Optimistic UI)
  setNotes(prevNotes =>
    prevNotes.map(n =>
      n.id === note.id
        ? { ...n, favorite: newFavoriteStatus }
        : n
    )
  );

  // 2. Update ke backend
  try {
    const res = await fetch(`${API_URL}/${note.id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        content: noteContent,
        color: note.color,
        favorite: newFavoriteStatus
      }),
    });

    const data = await res.json();

    if (data.success) {
      // 3. Add to history
      await addHistory({
        userName: user.name,
        userRole: user.role,
        action: 'edit',
        target: 'note',
        targetName: noteContent.substring(0, 30) + '...',
        description: `${user.name} ${newFavoriteStatus ? 'added note to favorites' : 'removed note from favorites'}`
      });
    } else {
      // 4. Rollback on error
      setNotes(prevNotes =>
        prevNotes.map(n =>
          n.id === note.id
            ? { ...n, favorite: note.favorite }
            : n
        )
      );
    }
  } catch (err) {
    // 5. Rollback on exception
    setNotes(prevNotes =>
      prevNotes.map(n =>
        n.id === note.id
          ? { ...n, favorite: note.favorite }
          : n
      )
    );
  }
};
```

### Backend (Express)

**File**: `server/src/controllers/noteController.ts`

```typescript
export const updateNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, color, favorite } = req.body;

    const note = await prisma.note.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(color !== undefined && { color }),
        ...(favorite !== undefined && { favorite })  // 👈 Update favorite
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: note
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
```

### History Display

**File**: `src/components/dashboards/modals/HistoryModal.tsx`

```typescript
// Deteksi favorite action
const isFavoriteAction = (entry: HistoryEntry): boolean => {
  return entry.description.includes('added note to favorites');
};

// Deteksi unfavorite action
const isUnfavoriteAction = (entry: HistoryEntry): boolean => {
  return entry.description.includes('removed note from favorites');
};

// Custom icon
const getIcon = (target, entry) => {
  if (entry && isFavoriteAction(entry)) {
    return <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />;
  }
  if (entry && isUnfavoriteAction(entry)) {
    return <Star className="w-4 h-4 fill-red-400 text-red-400" />;
  }
  // ... default icons
};

// Custom badge
const getActionBadgeClasses = (action, entry) => {
  if (entry && isFavoriteAction(entry)) {
    return `${baseClasses} bg-yellow-100 text-yellow-700 border border-yellow-400`;
  }
  if (entry && isUnfavoriteAction(entry)) {
    return `${baseClasses} bg-red-100 text-red-700 border border-red-400`;
  }
  // ... default badges
};

// Custom text
const getActionText = (action, entry) => {
  if (entry && isFavoriteAction(entry)) return 'Favorit';
  if (entry && isUnfavoriteAction(entry)) return 'Unfavorit';
  // ... default texts
};
```

## UI Components

### Note Card with Favorite Button

```jsx
<motion.div className="group relative rounded-3xl p-6">
  {/* Favorite Star - Only for ADMIN/SUPERUSER */}
  {canEdit && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(note);
      }}
      className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-black/80
                  flex items-center justify-center
                  transition-all duration-300 hover:scale-110
                  ${note.favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      title={note.favorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star
        className={`w-5 h-5 transition-all duration-300
                    ${note.favorite ? 'fill-yellow-400 text-yellow-400 scale-110' : 'text-white scale-100'}`}
      />
    </button>
  )}

  {/* Note Content */}
  <p>{note.content || note.text || ''}</p>
</motion.div>
```

### History Entry

```jsx
<div className="flex items-start gap-3">
  {/* Icon: Yellow star for favorite, red star for unfavorite */}
  <div className="p-2 rounded-lg">
    {getIcon(entry.target, entry)}
  </div>

  <div className="flex-1">
    <div className="flex items-center gap-2">
      <span className="font-semibold">{entry.userName}</span>
      {/* Badge: "Favorit" (yellow) or "Unfavorit" (red) */}
      <span className={getActionBadgeClasses(entry.action, entry)}>
        {getActionText(entry.action, entry)}
      </span>
    </div>
    <p className="text-sm">
      Note - "{entry.targetName}"
    </p>
  </div>
</div>
```

## Testing

### Manual Testing Steps

1. **Login as ADMIN/SUPERUSER**
   ```
   Username: usertaufan
   Password: taufan123
   ```

2. **Create a new note**
   - Navigate to Team Notes
   - Click "Add Note"
   - Fill content and select color
   - Save

3. **Test Favorite**
   - Hover over note card
   - Click star button (should appear in top-right)
   - ✅ Star should turn yellow immediately
   - ✅ No loading/delay
   - ✅ Animation smooth

4. **Verify History**
   - Open History modal
   - ✅ Should see "Favorit" badge (yellow)
   - ✅ Icon: Yellow star
   - ✅ Description: "added note to favorites"

5. **Test Unfavorite**
   - Click star button again
   - ✅ Star should turn white immediately
   - ✅ Smooth fade-out animation

6. **Verify Unfavorite History**
   - Refresh or wait 5 seconds (auto-refresh)
   - Open History modal
   - ✅ Should see "Unfavorit" badge (red)
   - ✅ Icon: Red star
   - ✅ Description: "removed note from favorites"

7. **Test Error Handling**
   - Disconnect internet
   - Try to toggle favorite
   - ✅ Animation should rollback
   - ✅ Console shows error

8. **Test Permission**
   - Login as UMUM user (umumalfi / alfi123)
   - Navigate to Team Notes
   - ✅ Star button should NOT be visible
   - ✅ Cannot toggle favorite

## Troubleshooting

### Issue: Star tidak berubah warna
**Solution**: Pastikan state lokal ter-update dengan benar. Check console untuk error.

### Issue: History tidak tercatat
**Solution**: Pastikan action menggunakan `'edit'` bukan `'favorite'`/`'unfavorite'` karena enum backend hanya support CREATE, EDIT, DELETE.

### Issue: Animasi tersendat
**Solution**: Pastikan `transition-all duration-300` sudah ditambahkan di className star icon.

### Issue: Rollback tidak bekerja
**Solution**: Pastikan catch block memiliki logic untuk kembalikan state ke nilai original.

## Best Practices

1. **Always use Optimistic UI** untuk UX yang lebih baik
2. **Always implement rollback** untuk error handling
3. **Always log actions** ke history untuk audit trail
4. **Use descriptive descriptions** agar mudah dipahami di history
5. **Test dengan berbagai roles** untuk memastikan permission bekerja
6. **Use semantic colors** (yellow = positive, red = negative)

## Security Considerations

1. ✅ **Authorization**: Only ADMIN/SUPERUSER can toggle favorite
2. ✅ **Ownership**: Backend validates user owns the note
3. ✅ **Rate Limiting**: API protected dengan rate limiter
4. ✅ **JWT Validation**: All requests require valid JWT token
5. ✅ **Input Validation**: Prisma handles SQL injection prevention

## Future Enhancements

Potential improvements untuk fitur favorite:

1. **Filter by Favorites**: Tambahkan filter untuk hanya show favorite notes
2. **Sort by Favorites**: Sort notes dengan favorite di atas
3. **Favorite Count**: Tampilkan jumlah notes yang difavoritkan
4. **Bulk Favorite**: Select multiple notes dan favorite sekaligus
5. **Favorite Categories**: Group favorites berdasarkan kategori
6. **Export Favorites**: Export daftar favorite notes ke PDF/CSV

---

**Last Updated**: 2025-01-04
**Version**: 1.0.0
**Author**: Team Mirov
