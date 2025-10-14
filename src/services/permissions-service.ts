
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { Role } from '@/lib/types';
import { revalidatePath } from 'next/cache';

type Permission = {
    href: string;
    labelKey: string;
    icon: string;
    roles: Role['name'][];
};

// IMPORTANT: This is a simplified solution for a demo environment.
// In a production application, you should NOT write to the file system
// from a serverless function. Instead, you would store this data in a
// database like Firestore.

const permissionsFilePath = path.join(process.cwd(), 'src', 'lib', 'permissions.json');

export async function updatePermissions(permissions: Permission[]) {
    try {
        const data = JSON.stringify(permissions, null, 2);
        await fs.writeFile(permissionsFilePath, data, 'utf-8');
        // Revalidate all paths to reflect permission changes on next navigation
        revalidatePath('/', 'layout');
    } catch (error) {
        console.error("Failed to write permissions file:", error);
        throw new Error("Could not update permissions.");
    }
}
