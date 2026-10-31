import {
  CreateSecretCommand,
  GetSecretValueCommand,
  GetSecretValueCommandOutput,
  PutSecretValueCommand,
  ResourceExistsException,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager"

export const createSecretsManagerClient = (): SecretsManagerClient => {
  return new SecretsManagerClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  })
}

export const getSecretValue = async (
  secretName: string
): Promise<GetSecretValueCommandOutput> => {
  const client = createSecretsManagerClient()
  return await client.send(new GetSecretValueCommand({ SecretId: secretName }))
}

export const upsertSecret = async (
  secretName: string,
  secretValue: Record<string, unknown>
): Promise<void> => {
  const client = createSecretsManagerClient()

  try {
    await client.send(
      new CreateSecretCommand({
        Name: secretName,
        SecretString: JSON.stringify(secretValue),
      })
    )
  } catch (err: unknown) {
    if (
      err instanceof ResourceExistsException ||
      (err as { name?: string })?.name === "ResourceExistsException"
    ) {
      await client.send(
        new PutSecretValueCommand({
          SecretId: secretName,
          SecretString: JSON.stringify(secretValue),
        })
      )
    } else {
      throw err
    }
  }
}

// turn the secret to actual object
export const parseSecretString = <T = Record<string, unknown>>(
  secret: GetSecretValueCommandOutput
): T | null => {
  if (!secret.SecretString) {
    return null
  }

  try {
    return JSON.parse(secret.SecretString) as T
  } catch {
    return null
  }
}
