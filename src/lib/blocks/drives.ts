import { blocksGatewayFetch } from "./http";

/**
 * The `BlxDrive` schema on the Data Gateway (`/data/v4/gateway`, blocks-data-gateway-crud)
 * — one row per user, pointing at the DMS directory that's their drive root
 * (`DriveId`). Looked up on login so the app knows which directory to open; created
 * once, the first time a user sets up their drive.
 */
export interface BlxDrive {
  ItemId: string;
  CreatedDate?: string;
  LastUpdatedDate?: string;
  CreatedBy?: string;
  Language?: string;
  LastUpdatedBy?: string;
  OrganizationId?: string;
  Tags?: string[];
  UserId: string;
  UserDisplayName: string;
  DriveId: string;
}

const GET_BLX_DRIVES = `
  query GetBlxDrives($userId: String!) {
    getBlxDrives(
      where: { UserId: { eq: $userId } }
      order: []
      paging: { pageNo: 1, pageSize: 10 }
    ) {
      items {
        ItemId
        CreatedDate
        LastUpdatedDate
        CreatedBy
        Language
        LastUpdatedBy
        OrganizationId
        Tags
        UserId
        UserDisplayName
        DriveId
      }
      totalCount
      pageNo
      pageSize
      totalPages
      hasNextPage
      hasPreviousPage
    }
  }
`;

const INSERT_BLX_DRIVE = `
  mutation InsertBlxDrive($userId: String!, $userDisplayName: String!, $driveId: String!) {
    insertBlxDrive(
      input: { UserId: $userId, UserDisplayName: $userDisplayName, DriveId: $driveId }
    ) {
      acknowledged
      itemId
      totalImpactedData
      message
    }
  }
`;

export interface ActionResponse {
  acknowledged?: boolean;
  itemId?: string;
  totalImpactedData?: number;
  message?: string;
}

export const drivesApi = {
  /** The signed-in user's drive record, or null if they haven't set one up yet. */
  findByUserId: async (userId: string): Promise<BlxDrive | null> => {
    const data = await blocksGatewayFetch<{ getBlxDrives: { items: BlxDrive[] } }>(GET_BLX_DRIVES, { userId });
    return data.getBlxDrives.items[0] ?? null;
  },

  insert: async (userId: string, userDisplayName: string, driveId: string): Promise<ActionResponse> => {
    const data = await blocksGatewayFetch<{ insertBlxDrive: ActionResponse }>(INSERT_BLX_DRIVE, {
      userId,
      userDisplayName,
      driveId,
    });
    return data.insertBlxDrive;
  },
};
